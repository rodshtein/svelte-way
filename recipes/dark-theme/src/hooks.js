import * as cookie from 'cookie';

export async function getSession(event) {

  // get user theme
  const { theme } = cookie.parse(event.request.headers.get('cookie') || '');

  // return to session obj
  return {
      user: { theme }
    }
}