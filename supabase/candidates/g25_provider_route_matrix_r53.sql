-- G25 R53 route-coherence overlay for the empty dormant R49 plus R51 registry.
-- It makes provider, processor, purpose and research control combinations truthful.

alter table private.brain_provider_exchanges
  add constraint brain_provider_exchanges_route_matrix_r53_check
  check (
    (processor_kind = 'model'
      and provider in ('openai', 'anthropic', 'google_ai', 'xai')
      and purpose_family in ('memory_and_intake', 'decision_support', 'briefing_and_coaching'))
    or (processor_kind = 'audio'
      and provider = 'elevenlabs'
      and purpose_family = 'briefing_and_coaching')
    or (processor_kind = 'research'
      and provider in (
        'perplexity', 'exa', 'brave', 'tavily', 'newsapi', 'builtwith',
        'people_data_labs', 'artificial_analysis', 'tranco', 'gdelt',
        'hacker_news_algolia', 'fixed_rss_publishers'
      )
      and purpose_family = 'research_and_enrichment')
    or (processor_kind = 'delivery'
      and provider = 'resend'
      and purpose_family = 'email_delivery')
    or (processor_kind = 'billing'
      and provider = 'stripe'
      and purpose_family = 'billing')
    or (processor_kind = 'configured_downstream'
      and provider = 'configured_downstream'
      and purpose_family = 'configured_downstream')
  );

alter table private.brain_provider_exchanges
  add constraint brain_provider_exchanges_research_control_r53_check
  check (
    processor_kind <> 'research'
    or (
      provider in ('artificial_analysis', 'fixed_rss_publishers')
      and control_mode = 'fixed_public_fetch'
      and query_minimization_sha256 is null
    )
    or (
      provider not in ('artificial_analysis', 'fixed_rss_publishers')
      and control_mode in (
        'public_policy_default', 'provider_policy_retention',
        'contractual_zdr', 'request_verified_zdr'
      )
      and query_minimization_sha256 is not null
    )
  );
