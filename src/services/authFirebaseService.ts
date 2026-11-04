import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { apiFetchJson } from "../api/client";

// Dispara el mail de Firebase; el link abre la ventana propia de Firebase donde
// el usuario elige la contraseña nueva. No pasa por nuestro backend.
export async function solicitarRecuperacionContrasena(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Se usa después de que el usuario cambió su contraseña en la ventana de Firebase:
// inicia sesión ahí y le pasa el idToken a /login/firebase, que devuelve el mismo
// tipo de JWT que el login normal o el de Google.
export async function iniciarSesionConFirebase(email: string, password: string): Promise<string> {
  const credencial = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credencial.user.getIdToken();

  const data = await apiFetchJson<{ token: string }>("/login/firebase", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  return data.token;
}
