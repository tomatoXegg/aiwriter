import Database from './init';

export interface QueryBuilderOptions {
  table: string;
  select?: string[];
  where?: Record<string, any>;
  whereIn?: Record<string, any[]>;
  whereNot?: Record<string, any>;
  whereLike?: Record<string, string>;
  whereBetween?: Record<string, [number, number]>;
  join?: Array<{
    table: string;
    on: string;
    type?: 'INNER' | 'LEFT' | 'RIGHT';
  }>;
  orderBy?: string | string[];
  order?: 'ASC' | 'DESC';
  groupBy?: string[];
  having?: Record<string, any>;
  limit?: number;
  offset?: number;
  distinct?: boolean;
}

export class QueryBuilder {
  private options: QueryBuilderOptions;

  constructor(options: QueryBuilderOptions) {
    this.options = options;
  }

  static table(table: string): QueryBuilder {
    return new QueryBuilder({ table });
  }

  select(columns: string[]): QueryBuilder {
    this.options.select = columns;
    return this;
  }

  where(conditions: Record<string, any>): QueryBuilder {
    this.options.where = { ...this.options.where, ...conditions };
    return this;
  }

  whereIn(column: string, values: any[]): QueryBuilder {
    this.options.whereIn = { ...this.options.whereIn, [column]: values };
    return this;
  }

  whereNot(conditions: Record<string, any>): QueryBuilder {
    this.options.whereNot = { ...this.options.whereNot, ...conditions };
    return this;
  }

  whereLike(conditions: Record<string, string>): QueryBuilder {
    this.options.whereLike = { ...this.options.whereLike, ...conditions };
    return this;
  }

  whereBetween(column: string, range: [number, number]): QueryBuilder {
    this.options.whereBetween = { ...this.options.whereBetween, [column]: range };
    return this;
  }

  join(table: string, on: string, type: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER'): QueryBuilder {
    if (!this.options.join) this.options.join = [];
    this.options.join.push({ table, on, type });
    return this;
  }

  orderBy(column: string | string[], direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.options.orderBy = column;
    this.options.order = direction;
    return this;
  }

  groupBy(columns: string[]): QueryBuilder {
    this.options.groupBy = columns;
    return this;
  }

  having(conditions: Record<string, any>): QueryBuilder {
    this.options.having = conditions;
    return this;
  }

  limit(limit: number): QueryBuilder {
    this.options.limit = limit;
    return this;
  }

  offset(offset: number): QueryBuilder {
    this.options.offset = offset;
    return this;
  }

  distinct(): QueryBuilder {
    this.options.distinct = true;
    return this;
  }

  build(): { query: string; params: any[] } {
    const params: any[] = [];
    let query = '';

    // SELECT clause
    const columns = this.options.select || ['*'];
    const distinct = this.options.distinct ? 'DISTINCT ' : '';
    query = `SELECT ${distinct}${columns.join(', ')} FROM ${this.options.table}`;

    // JOIN clause
    if (this.options.join) {
      for (const join of this.options.join) {
        query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
      }
    }

    // WHERE clause
    const whereClauses: string[] = [];
    
    if (this.options.where) {
      for (const [column, value] of Object.entries(this.options.where)) {
        if (value === null) {
          whereClauses.push(`${column} IS NULL`);
        } else {
          whereClauses.push(`${column} = ?`);
          params.push(value);
        }
      }
    }

    if (this.options.whereIn) {
      for (const [column, values] of Object.entries(this.options.whereIn)) {
        if (values.length > 0) {
          const placeholders = values.map(() => '?').join(', ');
          whereClauses.push(`${column} IN (${placeholders})`);
          params.push(...values);
        }
      }
    }

    if (this.options.whereNot) {
      for (const [column, value] of Object.entries(this.options.whereNot)) {
        if (value === null) {
          whereClauses.push(`${column} IS NOT NULL`);
        } else {
          whereClauses.push(`${column} != ?`);
          params.push(value);
        }
      }
    }

    if (this.options.whereLike) {
      for (const [column, value] of Object.entries(this.options.whereLike)) {
        whereClauses.push(`${column} LIKE ?`);
        params.push(`%${value}%`);
      }
    }

    if (this.options.whereBetween) {
      for (const [column, [min, max]] of Object.entries(this.options.whereBetween)) {
        whereClauses.push(`${column} BETWEEN ? AND ?`);
        params.push(min, max);
      }
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // GROUP BY clause
    if (this.options.groupBy) {
      query += ` GROUP BY ${this.options.groupBy.join(', ')}`;
    }

    // HAVING clause
    if (this.options.having) {
      const havingClauses: string[] = [];
      for (const [column, value] of Object.entries(this.options.having)) {
        havingClauses.push(`${column} = ?`);
        params.push(value);
      }
      query += ` HAVING ${havingClauses.join(' AND ')}`;
    }

    // ORDER BY clause
    if (this.options.orderBy) {
      const orderBy = Array.isArray(this.options.orderBy) 
        ? this.options.orderBy.join(', ')
        : this.options.orderBy;
      query += ` ORDER BY ${orderBy} ${this.options.order || 'ASC'}`;
    }

    // LIMIT and OFFSET
    if (this.options.limit) {
      query += ' LIMIT ?';
      params.push(this.options.limit);
    }

    if (this.options.offset) {
      query += ' OFFSET ?';
      params.push(this.options.offset);
    }

    return { query, params };
  }

  async execute(db: Database): Promise<any[]> {
    const { query, params } = this.build();
    return db.all(query, params);
  }

  async first(db: Database): Promise<any | null> {
    const { query, params } = this.limit(1).build();
    return db.get(query, params);
  }

  async count(db: Database): Promise<number> {
    const originalSelect = this.options.select;
    this.options.select = ['COUNT(*) as count'];
    const { query, params } = this.build();
    this.options.select = originalSelect;
    
    const result = await db.get(query, params);
    return result ? result.count : 0;
  }

  async exists(db: Database): Promise<boolean> {
    const count = await this.count(db);
    return count > 0;
  }

  clone(): QueryBuilder {
    return new QueryBuilder(JSON.parse(JSON.stringify(this.options)));
  }
}