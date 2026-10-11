Header de todo o site público.

```jsx
<SiteHeader logo={<img src="assets/img/selolibertaria.png" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
  items={['Loja','Sarau Safado','Projetos','Sobre','Contato']} active="Loja" cartCount={2} />
```

- Item ativo = filete vermelho de 2px embaixo. Nenhum outro estado colorido.
- Carrinho é vinho com contador em papel; é o único bloco de cor do header.
- No checkout, use só a marca + selo de SSL (veja `CheckoutStepper`).
