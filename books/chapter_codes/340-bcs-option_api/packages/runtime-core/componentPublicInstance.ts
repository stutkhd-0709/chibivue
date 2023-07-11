import { hasOwn } from "../shared";
import { ComponentInternalInstance, Data, getExposeProxy } from "./component";
import {
  ComponentInjectOptions,
  ComputedOptions,
  ExtractComputedReturns,
  InjectToObject,
  MethodOptions,
  ResolveProps,
} from "./componentOptions";
import { SlotsType, UnwrapSlotsType } from "./componentSlots";
import { nextTick, queueJob } from "./scheduler";

export type ComponentPublicInstanceConstructor<
  T extends ComponentPublicInstance<
    Props,
    RawBindings,
    D,
    C,
    M,
    I,
    S,
    E,
    EE
  > = ComponentPublicInstance<any>,
  Props = any,
  RawBindings = any,
  D = any,
  C extends ComputedOptions = any,
  M extends MethodOptions = MethodOptions,
  I extends ComponentInjectOptions = {},
  S extends SlotsType = {},
  E extends (event: string, ...args: any[]) => void = (
    event: string,
    ...args: any[]
  ) => void,
  EE extends string = string
> = {
  new (...args: any[]): T;
};

export type ComponentPublicInstance<
  P = {},
  B = {},
  D = {},
  C extends ComputedOptions = {},
  M extends MethodOptions = MethodOptions,
  I extends ComponentInjectOptions = {},
  S extends SlotsType = {},
  _E extends (event: string, ...args: any[]) => void = (
    event: string,
    ...args: any[]
  ) => void,
  _EE extends string = string
> = {
  $: ComponentInternalInstance;
  $data: D;
  $props: ResolveProps<P>;
  $slots: UnwrapSlotsType<S>;
  $parent: ComponentPublicInstance | null;
  $emit: (event: string, ...args: any[]) => void;
  $el: any;
  $forceUpdate: () => void;
  $nextTick: typeof nextTick;
} & P &
  B &
  D &
  M &
  ExtractComputedReturns<C> &
  InjectToObject<I>;

export type CreateComponentPublicInstance<
  P = {},
  B = {},
  D = {},
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions,
  I extends ComponentInjectOptions = {},
  S extends SlotsType = {},
  E extends (event: string, ...args: any[]) => void = (
    event: string,
    ...args: any[]
  ) => void,
  EE extends string = string
> = ComponentPublicInstance<P, B, D, C, M, I, S, E, EE>;

export interface ComponentRenderContext {
  [key: string]: any;
  _: ComponentInternalInstance;
}

const hasSetupBinding = (state: Data, key: string) => hasOwn(state, key);

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    const { setupState, props, data, ctx } = instance;

    let normalizedProps;
    if (hasSetupBinding(setupState, key)) {
      return setupState[key];
    } else if (
      (normalizedProps = instance.propsOptions) &&
      hasOwn(normalizedProps, key)
    ) {
      return props![key];
    } else if (hasOwn(data, key)) {
      return instance.data[key];
    } else if (hasOwn(ctx, key)) {
      return ctx[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
  set(
    { _: instance }: ComponentRenderContext,
    key: string,
    value: any
  ): boolean {
    const { setupState, data } = instance;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (hasOwn(data, key)) {
      instance.data[key] = value;
      return true;
    }
    return true;
  },
};

export type PublicPropertiesMap = Record<
  string,
  (i: ComponentInternalInstance) => any
>;

const getPublicInstance = (
  i: ComponentInternalInstance | null
): ComponentPublicInstance | ComponentInternalInstance["exposed"] | null => {
  if (!i) return null;
  return getExposeProxy(i) || i.proxy;
};

export const publicPropertiesMap: PublicPropertiesMap = {
  $: (i) => i,
  $el: (i) => i.vnode.el,
  $data: (i) => i.data,
  $props: (i) => i.props,
  $slots: (i) => i.slots,
  $parent: (i) => getPublicInstance(i.parent),
  $emit: (i) => i.emit,
  $forceUpdate: (i) => () => queueJob(i.update),
  $nextTick: (i) => nextTick.bind(i.proxy!),
};