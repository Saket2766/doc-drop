import {NavigationMenu} from "@/components/ui/navigation-menu"

export const Navbar = () => {
    return (
        <nav className="flex py-6 px-16 mx-auto mt-12 w-fit border border-gray-200 rounded-full">
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