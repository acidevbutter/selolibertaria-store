Rail de navegação do painel — use em toda tela de `/admin`, sempre com os mesmos três grupos.

```jsx
<ShellSidebar
  logo="assets/img/selolibertaria.png"
  current="eventos"
  parent="paginas"
  groups={[
    { label: 'Conteúdo', items: [{ id: 'paginas', label: 'Páginas', count: 9 }, { id: 'eventos', label: 'Eventos', count: 14 }] },
    { label: 'Operação', items: [{ id: 'pedidos', label: 'Pedidos', count: 31 }] },
    { label: 'Sistema', items: [{ id: 'config', label: 'Configurações' }] },
  ]}
  user={{ name: 'Marina · editora', capability: 'editorial.write' }}
/>
```

Componente fechado: não acrescente ícone, raio, recuo ou bege suave. Em `/admin/eventos/14` quem acende é `current="eventos"`.
