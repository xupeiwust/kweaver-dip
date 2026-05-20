import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const routeComponents = {
  DataDictList: lazy(() => import('./DataDictList')),
  CreateDataDict: lazy(() => import('./DataDictConfigForm')),
}

const DataDict = () => {
  return (
    <Routes>
      <Route index element={<routeComponents.DataDictList />} />
      <Route path="new" element={<routeComponents.CreateDataDict isNew />} />
      <Route path="edit/:id" element={<routeComponents.CreateDataDict isNew={false} />} />
    </Routes>
  )
}

export default DataDict
