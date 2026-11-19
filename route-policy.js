(() => {
  const policy = {"domain":"certifiedelastic.com","pagesHost":"exploit0101.github.io","pagesPrefix":"/sanam-certificate","credentialPath":"/3f3199a5-9059-4ac1-a82d-21e44f9af4dc","fragment":"#acc.ynpt7XOC","fallback":"https://www.elastic.co/"};
  const check = () => {
    const prefix = location.hostname === policy.pagesHost ? policy.pagesPrefix : '';
    const expected = prefix + policy.credentialPath;
    const validPath = location.pathname === expected || location.pathname === expected + '/';
    if (validPath && location.hash === policy.fragment && location.search === '') {
      document.documentElement.style.visibility = 'visible';
    } else {
      document.documentElement.style.visibility = 'hidden';
      location.replace(policy.fallback);
    }
  };
  check();
  window.addEventListener('hashchange', check);
  window.addEventListener('popstate', check);
})();
