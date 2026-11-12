import Library from './library';
import {requireChatGPTUser} from './chatgpt-auth';
export default async function Home(){await requireChatGPTUser('/');return <Library/>}
