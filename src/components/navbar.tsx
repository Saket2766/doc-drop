import {NavigationMenu} from "@/components/ui/navigation-menu"

export const Navbar = () => {
    return (
        <nav className="flex py-6 px-12 w-2/3 mx-auto my-6 justify-between items-center bg-white border border-gray-200 rounded-full">
            <div>
                <h1 className="scroll-m-20 text-center text-blue-500 text-4xl font-extrabold tracking-tight text-balance">
                    DocDrop
                </h1>
            </div>
            <NavigationMenu>

            </NavigationMenu>
        </nav>
    )
}