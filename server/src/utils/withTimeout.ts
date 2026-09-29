export class TimeoutError extends Error {}

// O SDK do Realtime Database repete indefinidamente quando a credencial é recusada, em vez de rejeitar;
// este limite transforma essa espera sem fim em um erro que a API consegue responder.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError('Tempo esgotado ao acessar o Firebase.')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
