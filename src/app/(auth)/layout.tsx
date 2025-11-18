import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'auth-background');

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Logo className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold">PredictPro</span>
          </Link>
        </div>
        <div className="p-8 space-y-6 bg-card/70 border border-border/50 rounded-2xl shadow-2xl backdrop-blur-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
