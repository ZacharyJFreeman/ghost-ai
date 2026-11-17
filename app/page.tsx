import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <span className="text-[3rem]">Ghost AI</span>
      <Button className="h-20 px-[25px] text-[35px]">Push me</Button>
    </div>
  );
}
