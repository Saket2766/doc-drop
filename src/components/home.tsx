import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import Upload from "@/assets/Upload.png";
import View from "@/assets/Comments.png";
import Share from "@/assets/Share.png";

export const Home = () => {
  return (
    <main className="w-5/6 md:w-2/3 flex justify-center min-h-[50vh] mt-16 mx-auto bg-white/50 bg-blur-md  rounded-2xl">
      <div className="w-full flex flex-col px-8 md:px-16">
        <h2 className="scroll-m-20 w-full md:w-fit mt-8 md:mt-4 mx-auto text-center p-2 md:px-8 md:pt-8 md:pb-2 border-b text-slate-700 text-xl md:text-3xl font-semibold tracking-tight">
          Manage all your projects in one place
        </h2>

        <p className="w-full py-8 text-sm md:text-lg text-slate-500 text-center leading-7">
          DocDrop is a platform that helps you manage your projects in one
          place. It allows you to upload, view, and share your documents with
          your team.
        </p>

        <div className="px-8 my-8">
          <Carousel opts={{ loop: true}} plugins={[Autoplay({ delay: 3000 })]}>
            <CarouselContent>
              {/*Upload*/}
              <CarouselItem>
                <div>
                  <h3 className="scroll-m-20 text-2xl text-center text-slate-700 font-semibold tracking-tight">
                    Upload
                  </h3>
                  <div className="relative">
                    <img src={Upload} alt="Upload" />
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div>
                  <h3 className="scroll-m-20 text-2xl text-center text-slate-700 font-semibold tracking-tight">
                    View
                  </h3>
                  <div className="flex">
                    <img src={View} alt="View" />
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div>
                  <h3 className="scroll-m-20 text-2xl text-center text-slate-700 font-semibold tracking-tight">
                    Share
                  </h3>
                  <div className="flex">
                    <img src={Share} alt="Share" />
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </main>
  );
};
