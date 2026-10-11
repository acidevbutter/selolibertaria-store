Campo único do sistema — 52px, rótulo sempre visível acima, nunca placeholder-como-rótulo.

```jsx
<Field label="CEP" state="error" value="00000-000"
       hint="Confira o número ou informe o endereço manualmente." />
```

- Foco = borda preta sólida + halo vinho de 2px (`--sl-focus-ring`).
- Erro sempre acompanhado de `hint` com uma ação de saída. Erro sem saída é proibido.
- `suffix` recebe bandeira do cartão, "?" do CVV ou botão colado (Calcular / Aplicar).
