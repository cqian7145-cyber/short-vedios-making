import 'dotenv/config';
import { getRecraftConfigurationState } from '../src/recraft/config';
import { formatRecraftStyleStatus } from '../src/recraft/status';

console.log(formatRecraftStyleStatus(getRecraftConfigurationState()));
