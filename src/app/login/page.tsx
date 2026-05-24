"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Swords, LogIn, UserPlus, Mail, CheckCircle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de connexion avec Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        if (!user.emailVerified) {
          setError("Veuillez vérifier votre email avant de vous connecter. Vérifiez vos spams.");
          return;
        }
        router.push("/");
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
        setPendingVerification(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.code === "auth/invalid-credential"
          ? "Identifiants incorrects."
          : err.code === "auth/email-already-in-use"
          ? "Cet email est déjà utilisé."
          : err.code === "auth/weak-password"
          ? "Le mot de passe doit contenir au moins 6 caractères."
          : err.message || "Erreur d'authentification."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown || !auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 60000);
    } catch (err: any) {
      setError(err.message || "Impossible de renvoyer l'email.");
    }
  };

  if (pendingVerification) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-5">
        <div className="w-full max-w-md rounded-xl border border-bd bg-sf p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-ok/10 border border-ok/20">
            <CheckCircle className="h-6 w-6 text-ok" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold tracking-wide">Vérifiez votre email</h1>
          <p className="mt-3 text-sm text-mt">
            Un email de vérification a été envoyé à <strong className="text-fg">{email}</strong>.
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
          </p>
          <p className="mt-2 text-xs text-mt">Pensez à vérifier vos spams.</p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={resendCooldown}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-bd bg-bg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sf-hover disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${resendCooldown ? "animate-spin" : ""}`} />
              {resendCooldown ? "Email renvoyé (attendez 1 min)" : "Renvoyer l'email"}
            </button>
            <button
              onClick={() => {
                setPendingVerification(false);
                setIsLogin(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              Retour à la connexion
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-err/10 px-3 py-2 text-sm text-err border border-err/20">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center p-5">
      <div className="w-full max-w-md rounded-xl border border-bd bg-sf p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-bg border border-bd">
            <Swords className="h-6 w-6 text-fg" />
          </div>
          <h1 className="font-cinzel text-2xl font-bold tracking-wide">
            {isLogin ? "Connexion" : "Inscription"}
          </h1>
          <p className="mt-2 text-sm text-mt">
            {isLogin
              ? "Connectez-vous pour proposer de nouveaux restaurants."
              : "Créez un compte pour rejoindre la communauté."}
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-bd bg-bg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sf-hover disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continuer avec Google
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-bd" />
          <span className="text-xs uppercase text-mt font-medium">Ou</span>
          <div className="h-px flex-1 bg-bd" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-mt" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-mt/50" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-bd bg-bg py-2.5 pl-10 pr-3 text-sm focus:border-fg focus:outline-none focus:ring-1 focus:ring-fg transition-colors"
                placeholder="vous@exemple.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-mt" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-bd bg-bg px-3 py-2.5 text-sm focus:border-fg focus:outline-none focus:ring-1 focus:ring-fg transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-err/10 px-3 py-2 text-sm text-err border border-err/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-mt">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="ml-1.5 font-medium text-fg underline underline-offset-4 hover:text-fg/80"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
