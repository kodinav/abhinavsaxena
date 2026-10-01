import type { StoryId } from '@/data/stories';
import type { StoryVisuals } from '../kit';
import { knowledge } from './knowledge';
import { delphi } from './delphi';
import { prometheus } from './prometheus';
import { elephant } from './elephant';
import { writing } from './writing';
import { wax } from './wax';
import { theseus } from './theseus';
import { indra } from './indra';
import { fish } from './fish';

/** The pictures for each section story, by story id. */
export const VISUALS: Partial<Record<StoryId, StoryVisuals>> = {
  delphi, prometheus, knowledge, elephant, writing, wax, theseus, indra, fish,
};
