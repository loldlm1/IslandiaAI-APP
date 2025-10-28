import React from "react";

export default function SvgMock(props: React.SVGProps<SVGSVGElement>) {
  return React.createElement("svg", { "data-testid": "svg-mock", ...props });
}
