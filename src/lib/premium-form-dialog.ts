export const premiumDialogContentClass =
  "gap-0 overflow-visible border-0 bg-white p-0 shadow-2xl sm:max-w-[600px] rounded-2xl [&>button]:right-6 [&>button]:top-6";

export const premiumDialogHeaderClass =
  "border-b border-slate-200 bg-slate-50 px-8 py-6 text-left";

export const premiumDialogTitleClass = "text-xl font-bold text-slate-900";

export const premiumDialogFooterClass =
  "bg-slate-50 p-6 rounded-b-2xl border-t border-slate-100 sm:justify-end";

export const premiumFormGridClass = "flex flex-col gap-6 overflow-visible px-8 py-6";

/** Descending z-index wrappers so open select menus overlay fields below them. */
export const premiumSelectFieldStackClasses = [
  "relative z-50",
  "relative z-40",
  "relative z-30",
] as const;

export const premiumLabelClass =
  "text-sm font-bold text-slate-400 tracking-wide mb-2 block";

export const premiumInputClass =
  "h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium shadow-sm focus-visible:ring-0 focus-visible:border-blue-500 focus:ring-0 focus:border-blue-500";

export const premiumNativeSelectClass = `${premiumInputClass} block w-full cursor-pointer`;

export const premiumPrimaryButtonClass =
  "rounded-xl bg-slate-900 font-medium text-white shadow-sm transition-colors hover:bg-slate-800";

export const premiumSubmitButtonClass =
  "h-12 w-full rounded-xl px-8 text-md font-medium sm:w-auto bg-slate-900 text-white shadow-sm transition-colors hover:bg-slate-800";

export const premiumModalSaveButtonClass =
  "flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-40 active:opacity-70";

export const premiumModalCancelButtonClass =
  "text-sm text-slate-600 transition-colors active:opacity-70";

export const premiumModalBackButtonClass =
  "flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 active:bg-slate-50";

export const premiumModalCheckIconClass = "h-4 w-4 text-indigo-600";
