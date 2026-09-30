export type ExperimentKind = 'kinetic' | 'ink' | 'develop' | 'pop' | 'momentum';

export interface Experiment {
  id: string;
  kind: ExperimentKind;
  title: string;
  /** interaction model, shown as the mono tag */
  model: string;
  /** what it says about Samudra */
  says: string;
  /** optional real photo for the Develop experiment (path under /public) */
  photo?: string;
}

export const playgroundExperiments: Experiment[] = [
  {
    id: 'exp_01',
    kind: 'kinetic',
    title: 'Kinetic',
    model: 'drag + physics',
    says: 'I like things that answer when you touch them.',
  },
  {
    id: 'exp_02',
    kind: 'ink',
    title: 'Ink',
    model: 'cursor + shader',
    says: 'Flat colour, hard edges, soft behaviour.',
  },
  {
    id: 'exp_03',
    kind: 'develop',
    title: 'Develop',
    model: 'hover + dwell',
    says: 'Photography taught me to wait for the picture.',
  },
  {
    id: 'exp_04',
    kind: 'pop',
    title: 'Pop',
    model: 'click',
    says: 'Every button should feel like a button.',
  },
  {
    id: 'exp_05',
    kind: 'momentum',
    title: 'Momentum',
    model: 'scroll + type',
    says: 'Type is a material. It has weight and it has speed.',
  },
];
