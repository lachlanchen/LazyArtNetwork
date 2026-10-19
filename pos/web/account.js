// Shared profile sign-in and wallet ownership are separate sessions.
const panel = document.getElementById('community-account');
async function request(path, body) {
  const response = await fetch('/api/v2/' + path, {method:body ? 'POST' : 'GET', credentials:'same-origin',
    cache:'no-store', headers:body ? {'Content-Type':'application/json'} : {},
    body:body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(55000)});
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error('Account sign-in is temporarily unavailable.'), {status:response.status});
  return data;
}
async function render() {
  const config = await request('auth/config');
  if (!config.enabled) return;
  panel.hidden = false;
  try {
    const account = await request('account');
    document.getElementById('community-name').textContent = account.username;
    document.getElementById('community-providers').hidden = true;
    document.getElementById('community-signout').hidden = false;
  } catch (error) {
    if (error.status !== 401) throw error;
    const buttons = document.getElementById('community-providers');
    buttons.replaceChildren(); buttons.hidden = false;
    const labels = {lazyingart:'LazyingArt',google:'Google',apple:'Apple',github:'GitHub'};
    for (const provider of config.providers) if (labels[provider]) {
      const link = document.createElement('a'); link.className='account-provider';
      link.href='/api/v2/auth/start?provider='+provider; link.textContent=labels[provider]; buttons.append(link);
    }
    document.getElementById('community-name').textContent='Your LazyingArt account';
    document.getElementById('community-signout').hidden=true;
  }
}
document.getElementById('community-signout').onclick = async event => {
  event.target.disabled=true;
  try {await request('logout', {});await render();}
  catch {document.getElementById('community-account-status').textContent='Could not confirm sign-out. Please try again.';}
  finally {event.target.disabled=false;}
};
const url = new URL(location.href), result=url.searchParams.get('account_result');
if(result){url.searchParams.delete('account_result');history.replaceState(null,'',url);if(result!=='connected')document.getElementById('community-account-status').textContent='Sign-in was not completed. Your wallet session is unchanged.';}
render().catch(()=>{panel.hidden=false;document.getElementById('community-account-status').textContent='Account sign-in is temporarily unavailable. Wallet features remain available.';});
