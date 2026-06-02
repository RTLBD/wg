import type { NitroFetchRequest, NitroFetchOptions } from 'nitropack/types';
import { FetchError } from 'ofetch';

type RevertFn = (success: boolean, data: unknown) => Promise<void>;

type SubmitOpts = {
  revert: RevertFn;
  successMsg?: string;
  noSuccessToast?: boolean;
};

export function useSubmit<R extends NitroFetchRequest>(
  url: R,
  options: NitroFetchOptions<R>,
  opts: SubmitOpts
) {
  const toast = useToast();

  return async (data: unknown) => {
    try {
      const res = await $fetch(url, {
        ...options,
        body: data as NitroFetchOptions<R>['body'],
      });

      if (!opts.noSuccessToast) {
        toast.showToast({
          type: 'success',
          message: opts.successMsg,
        });
      }

      await opts.revert(true, res);
    } catch (e) {
      if (e instanceof FetchError) {
        toast.showToast({
          type: 'error',
          message: e.data.message,
        });
      } else if (e instanceof Error) {
        toast.showToast({
          type: 'error',
          message: e.message,
        });
      } else {
        console.error(e);
      }
      await opts.revert(false, undefined);
    }
  };
}
