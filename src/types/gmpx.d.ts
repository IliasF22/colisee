import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "gmpx-api-loader": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          key?: string;
          "solution-channel"?: string;
        },
        HTMLElement
      >;
      "gmpx-place-picker": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          type?: string;
          country?: string;
          placeholder?: string;
          ref?: any;
        },
        HTMLElement
      >;
    }
  }
}
