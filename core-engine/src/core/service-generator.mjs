//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

class ServiceGenerator extends EventEmitter {
  constructor(metrics) {
    super();
    this.metrics = metrics;
    this.templates = new Map();
    this.validators = new Map();
    this.customizations = new Map();
    this.methodGenerators = new Map();
    this.hooks = {
      beforeGeneration: [],
      afterGeneration: [],
      onError: [],
    };
    this.setupDefaultTemplates();
    this.setupMethodGenerators();
  }

  setupDefaultTemplates() {
    this.registerTemplate('service', {
      generator: (params) => this.generateService(params),
      validator: (params) => this.validateServiceParams(params),
    });

    this.registerTemplate('api', {
      generator: (params) => this.generateApi(params),
      validator: (params) => this.validateApiParams(params),
    });

    this.registerTemplate('model', {
      generator: (params) => this.generateModel(params),
      validator: (params) => this.validateModelParams(params),
    });
  }

  setupMethodGenerators() {
    // CRUD Operations
    this.methodGenerators.set('findAll', {
      template: this.generateFindAllMethod,
      requiredImports: ['Repository', 'FindManyOptions'],
      permissions: ['read'],
      cacheable: true,
    });

    this.methodGenerators.set('findById', {
      template: this.generateFindByIdMethod,
      requiredImports: ['NotFoundException'],
      permissions: ['read'],
      cacheable: true,
    });

    this.methodGenerators.set('create', {
      template: this.generateCreateMethod,
      requiredImports: ['CreateDTO'],
      permissions: ['create'],
      events: ['created'],
    });

    this.methodGenerators.set('update', {
      template: this.generateUpdateMethod,
      requiredImports: ['UpdateDTO'],
      permissions: ['update'],
      events: ['updated'],
    });

    this.methodGenerators.set('delete', {
      template: this.generateDeleteMethod,
      permissions: ['delete'],
      events: ['deleted'],
    });

    // Advanced Operations
    this.methodGenerators.set('searchByFilters', {
      template: this.generateSearchMethod,
      requiredImports: ['FilterDTO', 'QueryBuilder'],
      permissions: ['read'],
      cacheable: true,
    });

    this.methodGenerators.set('exportToCSV', {
      template: this.generateExportMethod,
      requiredImports: ['ExportService'],
      permissions: ['export'],
      background: true,
    });

    this.methodGenerators.set('validateEmail', {
      template: this.generateEmailValidationMethod,
      requiredImports: ['ValidationService'],
      permissions: ['validate'],
    });

    this.methodGenerators.set('resetPassword', {
      template: this.generateResetPasswordMethod,
      requiredImports: ['AuthService', 'EmailService'],
      permissions: ['reset'],
      events: ['passwordReset'],
    });
  }

  registerTemplate(type, { generator, validator, hooks = {} }) {
    this.templates.set(type, generator);
    if (validator) this.validators.set(type, validator);
    if (hooks.before) this.hooks.beforeGeneration.push(hooks.before);
    if (hooks.after) this.hooks.afterGeneration.push(hooks.after);
    if (hooks.error) this.hooks.onError.push(hooks.error);
  }

  validateServiceParams(params) {
    const errors = [];

    if (!params.name) {
      errors.push('Service name is required');
    } else {
      if (!/^[a-zA-Z]\w*$/.test(params.name)) {
        errors.push(
          'Invalid service name format - must start with a letter and contain only letters, numbers, and underscores',
        );
      }
      if (params.name.length > 50) {
        errors.push('Service name too long (max 50 characters)');
      }
    }

    if (!Array.isArray(params.methods)) {
      errors.push('Methods must be an array');
    } else {
      params.methods.forEach((method, index) => {
        if (typeof method !== 'string') {
          errors.push(`Method at index ${index} must be a string`);
        } else if (!/^\w+$/.test(method)) {
          errors.push(`Invalid method name format: ${method}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error('Validation failed:\n' + errors.join('\n'));
    }
  }

  async generateService(params) {
    const { name, methods, options = {} } = params;
    const className = this.formatClassName(name);

    // Collect all required imports
    const imports = new Set(['Injectable', 'InjectRepository', 'Repository']);
    const methodsDetails = methods.map((method) => {
      const generator = this.methodGenerators.get(method);
      if (generator?.requiredImports) {
        generator.requiredImports.forEach((imp) => imports.add(imp));
      }
      return {
        name: method,
        ...generator,
      };
    });


    const importStatements = this.generateImports(
      className,
      Array.from(imports),
    );


    const classDecorators = this.generateClassDecorators(options);


    const constructor = this.generateConstructor(className, methodsDetails);


    const methodsCode = this.generateServiceMethods(methods);


    const helperMethods = this.generateHelperMethods(methodsDetails);

    return `${importStatements}

${classDecorators}
export class ${className}Service {
  ${constructor}

  ${methodsCode}

  ${helperMethods}
}`;
  }

  generateImports(className, imports) {
    const nestImports = imports.filter((imp) => !imp.includes('/')).join(', ');

    return `import { ${nestImports} } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${className}Entity } from '../entities/${className.toLowerCase()}.entity';
import { ${className}DTO } from '../dtos/${className.toLowerCase()}.dto';
import { LoggerService } from '../logger/logger.service';`;
  }

  generateClassDecorators(options) {
    const decorators = ['@Injectable()'];

    if (options.cache) {
      decorators.push(`@UseInterceptors(CacheInterceptor)`);
    }

    return decorators.join('\n');
  }

  generateConstructor(className, methodsDetails) {
    const services = new Set(['LoggerService']);
    methodsDetails.forEach((method) => {
      if (method.requiredImports) {
        method.requiredImports
          .filter((imp) => imp.endsWith('Service'))
          .forEach((service) => services.add(service));
      }
    });

    const serviceParams = Array.from(services)
      .map((service) => `private readonly ${service.toLowerCase()}: ${service}`)
      .join(',\n    ');

    return `constructor(
    @InjectRepository(${className}Entity)
    private readonly repository: Repository<${className}Entity>,
    ${serviceParams}
  ) {}`;
  }

  generateServiceMethods(methods) {
    return methods
      .map((method) => {
        const generator = this.methodGenerators.get(method);
        if (generator) {
          return generator.template.call(this);
        }
        return this.generateCustomMethod(method);
      })
      .join('\n\n');
  }

  generateHelperMethods(methodsDetails) {
    const methods = [];

    if (methodsDetails.some((m) => m.cacheable)) {
      methods.push(this.generateCacheHelpers());
    }

    if (methodsDetails.some((m) => m.events)) {
      methods.push(this.generateEventHelpers());
    }

    if (methodsDetails.some((m) => m.permissions)) {
      methods.push(this.generatePermissionHelpers());
    }

    return methods.join('\n\n');
  }

  generateCacheHelpers() {
    return `
  private getCacheKey(method: string, params: any): string {
    return \`\${this.constructor.name}:\${method}:\${JSON.stringify(params)}\`;
  }

  private async clearCache(pattern: string): Promise<void> {
    await this.cacheManager.del(pattern);
  }`;
  }

  generateEventHelpers() {
    return `
  private async emitEvent(event: string, payload: any): Promise<void> {
    this.eventEmitter.emit(\`\${this.constructor.name}.\${event}\`, {
      timestamp: new Date(),
      payload
    });
  }`;
  }

  generatePermissionHelpers() {
    return `
  private async checkPermission(user: any, permission: string): Promise<boolean> {
    return this.authService.hasPermission(user, \`\${this.constructor.name}.\${permission}\`);
  }`;
  }

  async generate(type, parameters) {
    const start = performance.now();

    try {
      // Run pre-generation hooks
      for (const hook of this.hooks.beforeGeneration) {
        await hook(type, parameters);
      }

      const generator = this.templates.get(type);
      if (!generator) {
        throw new Error(`Unsupported type: ${type}`);
      }

      const validator = this.validators.get(type);
      if (validator) {
        await validator(parameters);
      }

      const code = await generator(parameters);

      // Run post-generation hooks
      for (const hook of this.hooks.afterGeneration) {
        await hook(type, parameters, code);
      }

      const duration = performance.now() - start;
      this.metrics.record('generation.duration', duration);
      this.metrics.counter('generation.success');

      this.emit('generation:complete', {
        type,
        duration,
        parameters,
      });

      return code;
    } catch (error) {
      this.metrics.counter('generation.error');

      // Run error hooks
      for (const hook of this.hooks.onError) {
        await hook(error, type, parameters);
      }

      this.emit('generation:error', {
        type,
        error,
        parameters,
      });

      throw error;
    }
  }
}

export { ServiceGenerator };
