import React from 'react';
import { DeskButton } from '../oficina/DeskButton.jsx';

const Divider = () => <span aria-hidden="true" style={{ width: 1, height: 24, background: 'var(--ad-line-tool)', margin: '0 4px' }} />;

/** Editor · barra de ferramentas. Faixa bege, botões de 36px em grupos, desfazer à direita com contagem de passos. */
export function EditorToolbar({ groups = [], undoSteps, canRedo = false, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--ad-sand)', borderBottom: '1px solid var(--ad-line)', padding: '8px 14px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <Divider />}
          {g.map((b) => (
            <DeskButton
              key={b.label}
              variant={b.accent ? 'toolAccent' : 'tool'}
              active={b.active}
              style={b.square ? { width: 'var(--ad-h-tool)', padding: 0, fontSize: 15, fontWeight: b.label === 'B' ? 900 : 400, fontStyle: b.label === 'I' ? 'italic' : 'normal', textDecoration: b.label === 'U' ? 'underline' : 'none' } : undefined}
            >{b.label}</DeskButton>
          ))}
        </React.Fragment>
      ))}
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <DeskButton variant="tool" style={{ width: 'var(--ad-h-tool)', padding: 0, fontSize: 14 }}>↩</DeskButton>
        <DeskButton variant="tool" disabled={!canRedo} style={{ width: 'var(--ad-h-tool)', padding: 0, fontSize: 14 }}>↪</DeskButton>
        {undoSteps != null && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-text-quiet)' }}>{undoSteps} passos</span>}
      </span>
    </div>
  );
}
