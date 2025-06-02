
import { Heart } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SubmitFormHeader = () => {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Share Your Story</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Every story matters. Share your experiences, memories, and moments that have shaped your life. 
          Your story could inspire and connect with others in ways you never imagined.
        </p>
      </div>
      
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-serif flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Tell Your Story
        </CardTitle>
        <CardDescription>
          Fill out the form below to share your personal story with our community.
        </CardDescription>
      </CardHeader>
    </>
  );
};

export default SubmitFormHeader;
