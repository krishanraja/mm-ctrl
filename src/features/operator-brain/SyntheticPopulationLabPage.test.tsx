import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SyntheticPopulationLabPage from './SyntheticPopulationLabPage'
import { getSyntheticBrainAccount, syntheticBrainPopulation } from './syntheticPopulation'

function renderAccount(accountId: string) {
  return render(
    <MemoryRouter initialEntries={[`/operator/lab/synthetic-population/${accountId}`]}>
      <Routes>
        <Route path="/operator/lab/synthetic-population/:accountId" element={<SyntheticPopulationLabPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SyntheticPopulationLabPage', () => {
  it.each(syntheticBrainPopulation.map((account) => [account.id, account.displayName]))(
    'renders %s without losing its identity',
    (accountId, displayName) => {
      const view = renderAccount(accountId)
      expect(screen.getByTestId('synthetic-population-lab')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: displayName })).toBeInTheDocument()
      view.unmount()
    },
  )

  it('renders adversarial HTML as inert source text', () => {
    const account = getSyntheticBrainAccount('SYN-CUST-132')!
    const view = renderAccount(account.id)
    expect(view.container.querySelector('script')).toBeNull()
    expect(view.container.textContent).toContain('<script>window.location=')
  })

  it('renders the empty state without inventing evidence', () => {
    const view = renderAccount('SYN-CUST-101')
    expect(view.container.textContent).toContain('No evidence exists.')
    expect(view.container.textContent).toContain('restraint')
  })
})
