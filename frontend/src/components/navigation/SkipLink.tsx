import React from 'react'

export const MAIN_CONTENT_ID = 'main-content'

export const SkipLink: React.FC = () => (
  <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
    Skip to content
  </a>
)
