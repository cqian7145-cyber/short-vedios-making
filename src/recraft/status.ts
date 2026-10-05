import { RECRAFT_STYLE_PROFILE } from '../visual/recraftStyleProfile';
import { RecraftConfigurationState } from './config';

export type Phase2PreflightState = {
  deepseekConfigured: boolean;
  tavilyConfigured: boolean;
  recraft: RecraftConfigurationState;
};

const yesNo = (value: boolean) => value ? '✓ configured' : '✗ missing';

export function formatPhase2Preflight(state: Phase2PreflightState): string {
  return [
    'Phase 1:',
    `DeepSeek       ${yesNo(state.deepseekConfigured)}`,
    `Tavily         ${yesNo(state.tavilyConfigured)}`,
    '',
    'Phase 2:',
    `Recraft API    ${yesNo(state.recraft.apiConfigured)}`,
    `Recraft Style  ${state.recraft.styleStatus === 'locked' ? '✓ locked' : '✗ not locked'}`,
  ].join('\n');
}

export function formatRecraftStyleStatus(state: RecraftConfigurationState): string {
  return [
    'Visual profile:',
    RECRAFT_STYLE_PROFILE.name,
    '',
    'Profile version:',
    RECRAFT_STYLE_PROFILE.version,
    '',
    `API: ${state.apiConfigured ? 'configured' : 'missing'}`,
    `Style: ${state.styleStatus}`,
  ].join('\n');
}
