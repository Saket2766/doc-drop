import {NavigationMenu} from "@/components/ui/navigation-menu"

export const Navbar = () => {
    return (
        <nav className="flex p-4 mx-auto w-fit">
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