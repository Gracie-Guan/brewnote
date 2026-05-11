const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Text parsing heuristics
// ---------------------------------------------------------------------------

const PROCESS_KEYWORDS = [
  'anaerobic natural', 'anaerobic washed', 'carbonic maceration',
  'wet-hulled', 'pulped natural', 'natural process', 'washed process',
  'honey process', 'natural', 'washed', 'honey',
]

const FLAVOR_MAP: Record<string, string> = {
  'lychee': 'Lychee', 'chardonnay': 'Chardonnay', 'chamomile': 'Chamomile',
  'caramel': 'Caramel', 'chocolate': 'Chocolate', 'citrus': 'Citrus',
  'floral': 'Floral', 'nutty': 'Nutty', 'spice': 'Spice',
  'stone fruit': 'Stone Fruit', 'berry': 'Berry',
  'jasmine': 'Jasmine', 'peach': 'Peach', 'apricot': 'Apricot',
  'grape': 'Grape', 'blueberry': 'Blueberry', 'raspberry': 'Raspberry',
  'mango': 'Mango', 'passionfruit': 'Passionfruit', 'vanilla': 'Vanilla',
  'toffee': 'Toffee', 'hazelnut': 'Hazelnut', 'almond': 'Almond',
  'rose': 'Rose', 'lavender': 'Lavender', 'black tea': 'Black Tea',
  'brown sugar': 'Brown Sugar', 'dark chocolate': 'Dark Chocolate',
  'milk chocolate': 'Milk Chocolate',
}

function normalizeDate(s: string): string | null {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  // DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // DD MMM YYYY
  m = s.match(/^(\d{1,2})\s+(\w{3,})\s+(\d{4})$/)
  if (m) {
    const mon = months[m[2].toLowerCase().slice(0, 3)]
    if (mon) return `${m[3]}-${mon}-${m[1].padStart(2, '0')}`
  }
  return null
}

function parseLabel(text: string) {
  const lower = text.toLowerCase()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Weight — match e.g. "250g", "1kg", "1.5 kg", "500 g"
  let total_weight_g: number | null = null
  const wm = text.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i)
  if (wm) {
    const val = parseFloat(wm[1])
    total_weight_g = wm[2].toLowerCase() === 'kg' ? Math.round(val * 1000) : Math.round(val)
  }

  // Roast date — look for labeled dates first, then fallback to standalone dates
  let roast_date: string | null = null
  const datePats = [
    /(?:roasted?(?:\s+on)?|roast\s+date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:roasted?(?:\s+on)?|roast\s+date)[:\s]+(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:roasted?(?:\s+on)?|roast\s+date)[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/,
    /\b(\d{1,2}\s+\w{3,}\s+\d{4})\b/,
  ]
  for (const pat of datePats) {
    const dm = text.match(pat)
    if (dm) { roast_date = normalizeDate(dm[1]); if (roast_date) break }
  }

  // Process
  let process: string | null = null
  for (const p of PROCESS_KEYWORDS) {
    if (lower.includes(p)) {
      process = p.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
      break
    }
  }

  // Flavor tags — scan for known flavor keywords in full text
  const flavor_tags: string[] = []
  for (const [kw, label] of Object.entries(FLAVOR_MAP)) {
    if (lower.includes(kw)) flavor_tags.push(label)
  }

  // Roaster + name — heuristic: first two lines that look like names
  // Skip lines with numbers (weights, dates), or clearly non-name keywords
  const skipRe = /^\d|\b(?:roast|origin|farm|altitude|process|varietal?|certif|washed?|natural|honey|net|weight|gram|ml)\b/i
  const nameLines = lines.filter(l => l.length >= 2 && l.length <= 60 && !skipRe.test(l))
  const roaster = nameLines[0] ?? null
  const name = nameLines[1] ?? null

  return {
    roaster,
    name,
    roast_date,
    process,
    total_weight_g,
    flavor_tags: flavor_tags.length > 0 ? flavor_tags : null,
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { image } = await req.json()
    if (!image) return json({})

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
    if (!apiKey) return json({})

    const visionRes = await fetch(`${VISION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: image }, features: [{ type: 'TEXT_DETECTION' }] }],
      }),
    })

    if (!visionRes.ok) return json({})

    const visionData = await visionRes.json()
    const fullText: string = visionData.responses?.[0]?.textAnnotations?.[0]?.description ?? ''

    if (!fullText) return json({})

    return json(parseLabel(fullText))
  } catch {
    return json({})
  }
})
