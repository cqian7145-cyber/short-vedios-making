import 'dotenv/config';
import { getRecraftConfigurationState } from '../src/recraft/config';
import { formatPhase2Preflight } from '../src/recraft/status';

console.log(formatPhase2Preflight({
  deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
  tavilyConfigured: Boolean(process.env.TAVILY_API_KEY?.trim()),
  recraft: getRecraftConfigurationState(),
}));
