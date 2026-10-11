Entrada por provedor externo — decidido em 2026 que **entra** no `/login`.

```jsx
<SocialAuthButton provider="Google" iconSrc="/assets/img/icons/google.svg" />
```

- Hierarquia: e-mail e senha primeiro, botão preto de 48px "Entrar". O social vem **depois**, em papel branco com filete de 30%, separado por uma régua com o rótulo "ou".
- Ícone é o arquivo oficial do provedor, 18px, sem recorte e sem recolorir. Sem arquivo, não há botão — o sistema não reconstrói marca alheia.
- Rótulo: "Continuar com Google". Nunca "Login rápido", nunca "Entre com um clique".
- Sem raio, sem sombra, sem gradiente. Hover: fundo bege (`--sl-sand`).
