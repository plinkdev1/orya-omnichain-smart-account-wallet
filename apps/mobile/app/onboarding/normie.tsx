import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function NormieDeprecated() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/normie/social-login');
  }, [router]);

  return null;
}
