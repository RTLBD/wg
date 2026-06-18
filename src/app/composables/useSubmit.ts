import type { NitroFetchOptions } from 'nitropack/types';
import { FetchError } from 'ofetch';

type RevertFn = (success: boolean, data: unknown) => Promise<void>;

type SubmitOpts = {
  revert: RevertFn;
  successMsg?: string;
  noSuccessToast?: boolean;
};

export function useSubmit(
  url: string,
  options: NitroFetchOptions<string>,
  opts: SubmitOpts
) {
  const toast = useToast();
  const { t, te } = useI18n();

  return async (data: unknown) => {
    try {
      const res = await $fetch(url, {
        ...options,
        body: data as NitroFetchOptions<string>['body'],
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
        const rawMessage = e.data?.message ?? e.message;
        toast.showToast({
          type: 'error',
          message:
            typeof rawMessage === 'string' && te(rawMessage)
              ? t(rawMessage)
              : rawMessage,
        });
      } else if (e instanceof Error) {
        toast.showToast({
          type: 'error',
          message: te(e.message) ? t(e.message) : e.message,
        });
      } else {
        console.error(e);
      }
      await opts.revert(false, undefined);
    }
  };
}
