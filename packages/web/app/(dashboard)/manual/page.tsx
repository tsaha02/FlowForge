import { BookOpen, CheckCircle2, GitBranch, Lightbulb, PlayCircle, Wrench } from 'lucide-react';
import { NODE_TYPES } from '@/types/nodes';
import {
  buildWorkflowSteps,
  credentialsGuide,
  dayOneChecklist,
  editorBasics,
  gettingStartedChecklist,
  manualSections,
  nodeCategoryLabelByType,
  nodeManual,
  nodeTeachingGuides,
  orderedNodeTypes,
  platformTour,
  settingsGuide,
  troubleshootingItems,
  triggerGuide,
  webhookBusinessExamples,
  webhookExplainer,
  webhookIfNoApiGuide,
  workflowExamples,
} from '@/lib/manual';

const shell = {
  page: {
    minHeight: '100%',
    background:
      'radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 28%), linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
    padding: '32px',
  } as const,
  max: {
    maxWidth: 1320,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '280px minmax(0, 1fr)',
    gap: 24,
    alignItems: 'start',
  } as const,
  card: {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(148,163,184,0.2)',
    boxShadow: '0 24px 60px rgba(15,23,42,0.08)',
    borderRadius: 24,
    backdropFilter: 'blur(10px)',
  } as const,
};

const headingIcons = {
  'platform-tour': BookOpen,
  'getting-started': BookOpen,
  'choose-trigger': Lightbulb,
  'webhook-explained': Lightbulb,
  'credentials-and-settings': Wrench,
  'build-workflow': GitBranch,
  'example-workflows': PlayCircle,
  'node-reference': Wrench,
  troubleshooting: Lightbulb,
} as const;

export default function ManualPage() {
  return (
    <div style={shell.page}>
      <div style={shell.max}>
        <aside
          style={{
            ...shell.card,
            position: 'sticky',
            top: 24,
            padding: 22,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1D4ED8, #38BDF8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 700 }}>
                User Manual
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>FlowForge Guide</div>
            </div>
          </div>

          <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.65, color: '#475569' }}>
            Start here if you are new to automation. This guide explains the builder, the execution flow, and every node with practical examples.
          </p>

          <div style={{ display: 'grid', gap: 8 }}>
            {manualSections.map((section) => {
              const Icon = headingIcons[section.id as keyof typeof headingIcons];
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    color: '#1E293B',
                    textDecoration: 'none',
                    background: 'rgba(241,245,249,0.85)',
                    border: '1px solid rgba(148,163,184,0.18)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <Icon size={15} />
                  {section.label}
                </a>
              );
            })}
          </div>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(148,163,184,0.18)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Best Practice</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#475569' }}>
              Build a small happy-path workflow first, test it, then add branches, loops, and notifications afterward.
            </p>
          </div>
        </aside>

        <div style={{ display: 'grid', gap: 24 }}>
          <section style={{ ...shell.card, padding: 28 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(37,99,235,0.1)',
                color: '#1D4ED8',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <BookOpen size={14} />
              FlowForge Manual
            </div>

            <h1 style={{ margin: '18px 0 10px', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: '#0F172A' }}>
              Learn FlowForge like an operator, not just a tester.
            </h1>

            <p style={{ margin: 0, maxWidth: 860, fontSize: 17, lineHeight: 1.75, color: '#334155' }}>
              FlowForge lets you connect triggers, logic, APIs, AI, notifications, and data steps into one repeatable workflow. This manual is written for users who are brand new to workflow automation and need real examples instead of abstract descriptions.
            </p>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {dayOneChecklist.map((item, index) => (
                <div key={item} style={{ ...infoCard, background: 'rgba(239,246,255,0.72)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563EB', marginBottom: 6 }}>
                    Day 1 Step {index + 1}
                  </div>
                  <p style={bodyText}>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <SectionCard id="platform-tour" title="Platform Tour" icon={BookOpen}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {platformTour.map((area) => (
                <div key={area.title} style={infoCard}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{area.title}</div>
                  <p style={bodyText}>{area.description}</p>
                  <p style={{ ...bodyText, marginTop: 8, color: '#1E3A8A' }}>
                    Why it matters: {area.whyItMatters}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="getting-started" title="Getting Started" icon={BookOpen}>
            <TwoColumnGrid>
              <div>
                <h3 style={subheading}>What FlowForge does</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {editorBasics.map((item) => (
                    <div key={item.title} style={infoCard}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{item.title}</div>
                      <p style={bodyText}>{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={subheading}>First-time checklist</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {gettingStartedChecklist.map((item) => (
                    <div key={item} style={checkRow}>
                      <CheckCircle2 size={16} color="#2563EB" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TwoColumnGrid>
          </SectionCard>

          <SectionCard id="choose-trigger" title="Choose the Right Trigger" icon={Lightbulb}>
            <div style={{ display: 'grid', gap: 16 }}>
              {triggerGuide.map((trigger) => (
                <div key={trigger.title} style={exampleCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{trigger.title}</h3>
                    <span style={pill}>{trigger.useWhen}</span>
                  </div>
                  <p style={{ ...bodyText, marginTop: 10 }}>
                    <strong style={{ color: '#0F172A' }}>Plain language:</strong> {trigger.plainEnglish}
                  </p>
                  <p style={{ ...bodyText, marginTop: 6 }}>
                    <strong style={{ color: '#0F172A' }}>Business example:</strong> {trigger.example}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="webhook-explained" title="Webhook in Very Simple Language" icon={Lightbulb}>
            <div style={{ ...exampleCard, marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>The shortest explanation</h3>
              <p style={{ ...bodyText, marginTop: 10 }}>
                A webhook is like a doorbell for FlowForge. Another system rings that doorbell by sending data to your FlowForge backend URL. When FlowForge hears that doorbell, it starts the workflow immediately.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {webhookExplainer.map((item) => (
                <div key={item.title} style={timelineCard}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{item.title}</div>
                  <p style={bodyText}>{item.body}</p>
                </div>
              ))}
            </div>

            <TwoColumnGrid>
              <div style={{ marginTop: 18 }}>
                <h3 style={subheading}>Real business examples</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {webhookBusinessExamples.map((item) => (
                    <div key={item.title} style={infoCard}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 5 }}>{item.title}</div>
                      <p style={bodyText}>{item.story}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <h3 style={subheading}>If my business has no API, can I still use FlowForge?</h3>
                <List items={webhookIfNoApiGuide} />
                <div style={{ ...infoCard, marginTop: 12, background: 'rgba(255,251,235,0.85)' }}>
                  <p style={{ ...bodyText, color: '#92400E' }}>
                    If nothing in your business can send data out, webhook is not the right trigger. In that case, use Manual or Cron instead.
                  </p>
                </div>
              </div>
            </TwoColumnGrid>
          </SectionCard>

          <SectionCard id="credentials-and-settings" title="Credentials and Settings" icon={Wrench}>
            <TwoColumnGrid>
              <div>
                <h3 style={subheading}>Credentials</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {credentialsGuide.map((item) => (
                    <div key={item.title} style={infoCard}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 5 }}>{item.title}</div>
                      <p style={bodyText}>{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={subheading}>Settings</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {settingsGuide.map((item) => (
                    <div key={item.title} style={infoCard}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 5 }}>{item.title}</div>
                      <p style={bodyText}>{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TwoColumnGrid>

            <div style={{ ...exampleCard, marginTop: 18 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Simple rule for beginners</h3>
              <p style={{ ...bodyText, marginTop: 10 }}>
                If a node needs a secret, store that secret in Credentials first. If a screen changes how the product behaves for you or your team, look in Settings.
              </p>
            </div>
          </SectionCard>

          <SectionCard id="build-workflow" title="How To Build a Workflow" icon={GitBranch}>
            <div style={{ display: 'grid', gap: 14 }}>
              {buildWorkflowSteps.map((step) => (
                <div key={step.title} style={timelineCard}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{step.title}</div>
                  <p style={bodyText}>{step.body}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="example-workflows" title="Example Workflows" icon={PlayCircle}>
            <div style={{ display: 'grid', gap: 18 }}>
              {workflowExamples.map((example) => (
                <div key={example.id} style={exampleCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{example.title}</h3>
                      <p style={{ ...bodyText, marginTop: 8 }}>{example.summary}</p>
                    </div>
                    <div style={pillWrap}>
                      {example.nodes.map((node) => (
                        <span key={node} style={pill}>
                          {node}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    {example.steps.map((step, index) => (
                      <div key={step} style={stepRow}>
                        <div style={stepNumber}>{index + 1}</div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(15,23,42,0.04)', color: '#0F172A', fontWeight: 600 }}>
                    Result: {example.result}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="node-reference" title="Node Reference" icon={Wrench}>
            <p style={{ ...bodyText, marginBottom: 18 }}>
              The node guide below is based on the current FlowForge runtime. Every section includes a plain-language explanation, setup steps, example configuration, and the kind of data the next node will receive.
            </p>

            <div style={{ display: 'grid', gap: 18 }}>
              {orderedNodeTypes.map((type) => {
                const node = NODE_TYPES[type];
                const guide = nodeManual[type];
                const teaching = nodeTeachingGuides[type];
                if (!guide) return null;

                return (
                  <article key={type} id={`node-${type}`} style={nodeCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            border: `1px solid ${node.color}33`,
                            background: `${node.color}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24,
                            flexShrink: 0,
                          }}
                        >
                          {node.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748B' }}>
                            {nodeCategoryLabelByType[type]}
                          </div>
                          <h3 style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{node.label}</h3>
                          <p style={bodyText}>{guide.purpose}</p>
                        </div>
                      </div>

                      <div style={pillWrap}>
                        <span style={pill}>Inputs: {node.inputs}</span>
                        <span style={pill}>Outputs: {node.outputs}</span>
                      </div>
                    </div>

                    <TwoColumnGrid>
                      <div>
                        {teaching ? (
                          <div style={{ ...infoCard, marginBottom: 16, background: 'rgba(239,246,255,0.72)' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Real-world use case
                            </div>
                            <p style={bodyText}>{teaching.businessUseCase}</p>
                          </div>
                        ) : null}

                        <h4 style={miniHeading}>Best for</h4>
                        <List items={guide.bestFor} />

                        <h4 style={{ ...miniHeading, marginTop: 18 }}>How to configure it</h4>
                        <NumberedList items={guide.setup} />

                        {teaching ? (
                          <>
                            <h4 style={{ ...miniHeading, marginTop: 18 }}>Use this node when</h4>
                            <List items={teaching.useItWhen} />
                          </>
                        ) : null}
                      </div>

                      <div>
                        <h4 style={miniHeading}>Important notes</h4>
                        <List items={guide.notes} />

                        {teaching ? (
                          <>
                            <h4 style={{ ...miniHeading, marginTop: 18 }}>Do not start with this node when</h4>
                            <List items={teaching.notIdealWhen} accent="#DC2626" />
                          </>
                        ) : null}

                        {guide.warnings?.length ? (
                          <>
                            <h4 style={{ ...miniHeading, marginTop: 18, color: '#B45309' }}>Current limitations</h4>
                            <List items={guide.warnings} accent="#F59E0B" />
                          </>
                        ) : null}
                      </div>
                    </TwoColumnGrid>

                    {teaching ? (
                      <TwoColumnGrid>
                        <div style={{ ...infoCard, marginTop: 18 }}>
                          <h4 style={{ ...miniHeading, marginBottom: 10 }}>Simple first test</h4>
                          <NumberedList items={teaching.firstTest} />
                        </div>
                        <div style={{ ...infoCard, marginTop: 18, background: 'rgba(254,242,242,0.78)' }}>
                          <h4 style={{ ...miniHeading, marginBottom: 10, color: '#991B1B' }}>Common beginner mistakes</h4>
                          <List items={teaching.beginnerMistakes} accent="#DC2626" />
                        </div>
                      </TwoColumnGrid>
                    ) : null}

                    <CodeExample title="Example configuration" code={guide.configExample} />
                    <TwoColumnGrid>
                      <CodeExample title="Example input" code={guide.inputExample} />
                      <CodeExample title="Example output" code={guide.outputExample} />
                    </TwoColumnGrid>
                  </article>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard id="troubleshooting" title="Troubleshooting" icon={Lightbulb}>
            <div style={{ display: 'grid', gap: 14 }}>
              {troubleshootingItems.map((item) => (
                <div key={item.title} style={infoCard}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 5 }}>{item.title}</div>
                  <p style={bodyText}>{item.body}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ ...shell.card, padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'rgba(37,99,235,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1D4ED8',
          }}
        >
          <Icon size={18} />
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TwoColumnGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18,
      }}
    >
      {children}
    </div>
  );
}

function List({ items, accent = '#2563EB' }: { items: string[]; accent?: string }) {
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#334155', fontSize: 14, lineHeight: 1.65 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: accent,
              marginTop: 8,
              flexShrink: 0,
            }}
          />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item, index) => (
        <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: '#334155', fontSize: 14, lineHeight: 1.65 }}>
          <div style={stepNumber}>{index + 1}</div>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function CodeExample({ title, code }: { title: string; code: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.2)',
        background: '#0F172A',
        marginTop: 18,
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,0.15)', color: '#CBD5E1', fontSize: 12, fontWeight: 700 }}>
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 16,
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          color: '#E2E8F0',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {code}
      </pre>
    </div>
  );
}

const subheading = {
  margin: '0 0 12px',
  fontSize: 18,
  fontWeight: 800,
  color: '#0F172A',
} as const;

const miniHeading = {
  margin: '0 0 10px',
  fontSize: 14,
  fontWeight: 800,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#475569',
} as const;

const bodyText = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.75,
  color: '#475569',
} as const;

const infoCard = {
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(248,250,252,0.8)',
} as const;

const checkRow = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '10px 12px',
  borderRadius: 14,
  background: 'rgba(239,246,255,0.7)',
  border: '1px solid rgba(147,197,253,0.28)',
  color: '#1E293B',
  fontSize: 14,
  lineHeight: 1.6,
} as const;

const timelineCard = {
  padding: '16px 18px',
  borderRadius: 18,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.92))',
  border: '1px solid rgba(148,163,184,0.18)',
} as const;

const exampleCard = {
  padding: 20,
  borderRadius: 20,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.78)',
} as const;

const pillWrap = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap' as const,
} as const;

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(15,23,42,0.06)',
  color: '#334155',
  fontSize: 12,
  fontWeight: 700,
} as const;

const stepRow = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  color: '#334155',
  fontSize: 14,
  lineHeight: 1.65,
} as const;

const stepNumber = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: '#DBEAFE',
  color: '#1D4ED8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 800,
  flexShrink: 0,
} as const;

const nodeCard = {
  padding: 22,
  borderRadius: 22,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.92))',
} as const;
