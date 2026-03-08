interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (callback?: (notification: any) => void) => void;
        cancel: () => void;
        renderButton: (element: HTMLElement, config: any) => void;
      };
    };
  };
}
