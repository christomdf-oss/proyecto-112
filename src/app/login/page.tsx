'use client';
import {
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.651-3.356-11.303-8H4.389c2.834,7.832,10.608,12,19.611,12z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.998,36.983,44,31.1,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
}

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <div className="rounded-full bg-primary/10 p-3">
                    <div className="rounded-full bg-primary/20 p-3">
                        <svg
                            className="h-10 w-10 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12.6,2.02c-5.5,0-10,4.48-10,10c0,5.52,4.5,10,10,10c5.52,0,10-4.48,10-10C22.6,6.5,18.12,2.02,12.6,2.02z M12.6,20.02c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S17.01,20.02,12.6,20.02z M13.6,12.02V8.02h-2v6h5v-2H13.6z" />
                        </svg>
                    </div>
                </div>
            </div>
          <CardTitle className="text-2xl font-bold">COBACAM Asistencia</CardTitle>
          <CardDescription>Inicia sesión para administrar el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignIn} className="w-full">
            <GoogleIcon className="mr-2" />
            Iniciar Sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
