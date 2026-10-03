import React from 'react'
import { MainLayout } from '@/components/layout'
import { EmptyState } from '@/components/feedback'
import { Button } from '@/components/common'

export const NotFoundPage: React.FC = () => {
  return (
    <MainLayout>
      <EmptyState
        icon="🔍"
        title="Page Not Found"
        description="The campus page or resource you are looking for does not exist or has been moved."
        action={
          <Button variant="primary" onClick={() => (window.location.href = '/')}>
            Return to Dashboard
          </Button>
        }
      />
    </MainLayout>
  )
}
