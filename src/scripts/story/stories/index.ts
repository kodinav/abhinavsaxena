import type { StoryId } from '@/data/stories';
import type { StoryVisuals } from '../puppet/theatre';
import { cave } from './cave';
import { delphi } from './delphi';
import { prometheus } from './prometheus';
import { knowledge } from './knowledge';
import { theseus } from './theseus';
import { fish } from './fish';

/** The pictures for each story, by id. The cave is the hero's; the rest belong to sections of the home page. */
export const VISUALS: Partial<Record<StoryId, StoryVisuals>> = { cave, delphi, prometheus, knowledge, theseus, fish };
