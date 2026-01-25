import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { useStateStore, type pathItem } from "@/store/stateStore";


export const PathBar = () => {
    const currentPath = useStateStore<pathItem[] | null>(state => state.currentPath);
    return (
        <Breadcrumb>
            {currentPath?.map((item,idx) => (
                <>
                    <BreadcrumbItem key={item.label}>
                        {item.isLink ? <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink> : <BreadcrumbPage>{item.label}</BreadcrumbPage>}
                    </BreadcrumbItem>
                    {idx < currentPath.length - 1 && <BreadcrumbSeparator />}
                </>
            ))}
        </Breadcrumb>
    )
};