import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';

// ✅ Export the interface
export interface RouteInfo {
  path: string;
  method: string;
  controller: string;
  handler: string;
  description?: string;
}

@Injectable()
export class RoutesService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  getAllRoutes(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    const controllers = this.discoveryService
      .getControllers()
      .filter((wrapper: InstanceWrapper) => wrapper && wrapper.metatype);

    controllers.forEach((wrapper: InstanceWrapper) => {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) return;

      const prototype = Object.getPrototypeOf(instance);
      const controllerPath =
        this.reflector.get<string>(PATH_METADATA, metatype) || '';

      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodName: string) => {
          const methodRef = prototype[methodName];
          const path = this.reflector.get<string>(PATH_METADATA, methodRef);
          const method = this.reflector.get<RequestMethod>(
            METHOD_METADATA,
            methodRef,
          );

          if (path !== undefined && method !== undefined) {
            const fullPath = this.normalizePath(`/${controllerPath}/${path}`);

            routes.push({
              path: fullPath,
              method: this.getMethodString(method),
              controller: metatype.name,
              handler: methodName,
            });
          }
        },
      );
    });

    return routes.sort((a, b) => a.path.localeCompare(b.path));
  }

  getGroupedRoutes(): Record<string, RouteInfo[]> {
    const routes = this.getAllRoutes();

    return routes.reduce(
      (acc, route) => {
        const pathParts = route.path.split('/').filter(Boolean);
        const module = pathParts.length > 1 ? pathParts[1] : 'root';

        if (!acc[module]) {
          acc[module] = [];
        }

        acc[module].push(route);
        return acc;
      },
      {} as Record<string, RouteInfo[]>,
    );
  }

  getRouteStats() {
    const routes = this.getAllRoutes();

    return {
      total: routes.length,
      byMethod: routes.reduce(
        (acc, route) => {
          acc[route.method] = (acc[route.method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byController: routes.reduce(
        (acc, route) => {
          acc[route.controller] = (acc[route.controller] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      modules: Object.keys(this.getGroupedRoutes()),
    };
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  /**
   * Convert RequestMethod enum to string
   */
  private getMethodString(method: RequestMethod): string {
    const methodMap: Record<RequestMethod, string> = {
      [RequestMethod.GET]: 'GET',
      [RequestMethod.POST]: 'POST',
      [RequestMethod.PUT]: 'PUT',
      [RequestMethod.DELETE]: 'DELETE',
      [RequestMethod.PATCH]: 'PATCH',
      [RequestMethod.OPTIONS]: 'OPTIONS',
      [RequestMethod.HEAD]: 'HEAD',
      [RequestMethod.ALL]: 'ALL',
      [RequestMethod.SEARCH]: '',
      [RequestMethod.PROPFIND]: '',
      [RequestMethod.PROPPATCH]: '',
      [RequestMethod.MKCOL]: '',
      [RequestMethod.COPY]: '',
      [RequestMethod.MOVE]: '',
      [RequestMethod.LOCK]: '',
      [RequestMethod.UNLOCK]: '',
    };

    return methodMap[method] || 'UNKNOWN';
  }
}
