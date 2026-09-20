import React from 'react'
import ReactDOM from 'react-dom/client'
import '../src/index.css'
import StandardReviewPreviewPage from '../src/features/standard-review/StandardReviewPreviewPage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StandardReviewPreviewPage />
  </React.StrictMode>,
)
