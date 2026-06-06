import { createContext, useContext, useState } from 'react'

const AppUIContext = createContext(null)

export function AppUIProvider({ children }) {
  const [hideLogBrew, setHideLogBrew] = useState(false)
  return (
    <AppUIContext.Provider value={{ hideLogBrew, setHideLogBrew }}>
      {children}
    </AppUIContext.Provider>
  )
}

export function useAppUI() {
  return useContext(AppUIContext)
}
