import React from "react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../ui/breadcrumb";
import { useStateStore, type pathItem } from "@/store/stateStore";

export const PathBar = () => {
  const currentPath = useStateStore<pathItem[] | null>(
    (state) => state.currentPath,
  );
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-xs md:text-sm">
        {currentPath?.map((item, idx) => (
          <React.Fragment key={idx}>
            <BreadcrumbItem>
              {item.isLink && item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {idx < currentPath.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
