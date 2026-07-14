import { useState, useEffect } from 'react';
import { 
  Database, Play, Terminal, HelpCircle, Table, RefreshCw, AlertCircle, CheckCircle2, 
  Trash2, Plus, Copy, FileText, ChevronRight, Search, Download, Settings, Code, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default Supabase configuration provided by the user
const DEFAULT_SUPABASE_URL = 'https://ybcsvzgmwwizcoyrzdei.supabase.co/rest/v1/';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_fhs8wwCuM7gQK0bMO4CLLg_m1haFM3V';

// Default sample tables if connection is loading or offline
const SAMPLE_TABLES = [
  { name: 'products', type: 'table', columns: ['id', 'title', 'price', 'stock', 'image', 'description', 'category', 'created_at'] },
  { name: 'orders', type: 'table', columns: ['id', 'customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'total', 'status', 'created_at'] },
  { name: 'order_items', type: 'table', columns: ['id', 'order_id', 'product_id', 'title', 'price', 'quantity'] },
  { name: 'notifications', type: 'table', columns: ['id', 'type', 'recipient', 'message', 'status', 'created_at'] }
];

const PRESET_TEMPLATES = [
  {
    name: 'List All Products',
    sql: 'SELECT * FROM products ORDER BY price DESC;',
    description: 'Fetch all products sorted by price in descending order.'
  },
  {
    name: 'List Recent Orders',
    sql: 'SELECT id, customer_name, total, status FROM orders ORDER BY created_at DESC LIMIT 5;',
    description: 'Retrieve the 5 most recent orders with key information.'
  },
  {
    name: 'Total Revenue by Status',
    sql: 'SELECT status, SUM(total) as total_revenue, COUNT(*) as order_count FROM orders GROUP BY status;',
    description: 'Aggregate revenue and order count by status.'
  },
  {
    name: 'Add Sample Product',
    sql: "INSERT INTO products (title, price, stock, description, image, category)\nVALUES ('GAAFOW Ultra Slim Powerbank', 35.00, 50, '10000mAh pocket-sized fast charger', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=600', 'Accessories');",
    description: 'Insert a new item into the products table.'
  },
  {
    name: 'Update Order Status',
    sql: "UPDATE orders SET status = 'Delivered' WHERE id = 'GF-1002';",
    description: 'Modify status of a specific order.'
  }
];

const SETUP_SQL_SCRIPT = `-- ==========================================
-- GAAFOW DATABASE SETUP & SEED SCRIPT
-- Copy and run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create PRODUCTS Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    category TEXT,
    image TEXT,
    rating DECIMAL(3, 2) DEFAULT 4.5,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Custom format (e.g. GF-1002)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT,
    payment_method TEXT NOT NULL DEFAULT 'COD',
    payment_proof TEXT, -- Base64 data URL
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Pending Verification',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create ORDER_ITEMS Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    image TEXT
);

-- 4. Create NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'email' or 'whatsapp'
    recipient TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) and Create Public Policies
-- This allows GAAFOW client-side direct interactions
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create ultra-simple public access policies for client-side demo integration
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public all orders" ON public.orders;
CREATE POLICY "Allow public all orders" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all order_items" ON public.order_items;
CREATE POLICY "Allow public all order_items" ON public.order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all notifications" ON public.notifications;
CREATE POLICY "Allow public all notifications" ON public.notifications FOR ALL USING (true);

-- 6. Seed initial high-fidelity products
INSERT INTO public.products (title, description, price, stock, category, image, rating, reviews_count)
VALUES 
('Nido Milk Powder 2.5kg', 'Nestle Nido fortified full cream milk powder, perfect for Somali tea and family nutrition.', 38.50, 45, 'Groceries', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600', 4.8, 124),
('GAAFOW Smart Watch S3', 'Premium Somali localized smart watch with health tracking, Mogadishu prayer times alarm, and notifications.', 65.00, 28, 'Electronics', 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600', 4.7, 86),
('Khaas Somali Spices Mix 500g', 'Traditional custom blend spices containing cardamom, cumin, ginger, cinnamon, and cloves for local dishes.', 12.00, 150, 'Groceries', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 4.9, 210),
('Anker PowerCore 20000mAh', 'High-capacity ultra fast charging powerbank, essential for power reliability in Mogadishu.', 45.00, 60, 'Electronics', 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=600', 4.6, 95);`;

export default function SqlEditor() {
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return localStorage.getItem('gaafow_sb_url') || DEFAULT_SUPABASE_URL;
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    return localStorage.getItem('gaafow_sb_key') || DEFAULT_SUPABASE_KEY;
  });
  
  const [activeTab, setActiveTab] = useState<'editor' | 'browser' | 'settings' | 'setup'>('editor');
  const [sqlQuery, setSqlQuery] = useState(PRESET_TEMPLATES[0].sql);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Database Metadata
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  
  // Query Results
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [affectedRows, setAffectedRows] = useState<number | null>(null);
  
  // Direct REST state
  const [tableSearch, setTableSearch] = useState('');
  const [restLimit, setRestLimit] = useState(20);
  const [restOffset, setRestOffset] = useState(0);

  // Sync Supabase settings to local storage
  const handleSaveSettings = () => {
    localStorage.setItem('gaafow_sb_url', supabaseUrl);
    localStorage.setItem('gaafow_sb_key', supabaseKey);
    setSuccessMsg('Supabase Connection Settings saved locally!');
    setTimeout(() => setSuccessMsg(null), 3000);
    testConnection();
  };

  // Dynamic Authorization Headers Builder
  // Only appends Authorization: Bearer if the key starts with 'eyJ' (indicating a standard JWT).
  // This bypasses the 401 Unauthorized error on Kong gateway for non-JWT publishable/custom api keys.
  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const trimmedKey = supabaseKey.trim();
    const headers: Record<string, string> = {
      'apikey': trimmedKey,
      ...extra
    };
    if (trimmedKey.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${trimmedKey}`;
    }
    return headers;
  };

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setConnectionStatus('failed');
      setErrorMsg('Supabase URL and API Key are required.');
      return;
    }

    setIsConnecting(true);
    setErrorMsg(null);
    setConnectionStatus('idle');

    try {
      // Fetch PostgREST OpenAPI spec to discover tables and endpoints
      const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
      const response = await fetch(cleanUrl, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const schema = await response.json();
      
      // Parse available tables/definitions from OpenAPI swagger schema
      const detectedTables: any[] = [];
      if (schema.definitions) {
        Object.keys(schema.definitions).forEach(name => {
          const properties = schema.definitions[name].properties || {};
          detectedTables.push({
            name,
            type: 'table',
            columns: Object.keys(properties)
          });
        });
      }

      setTables(detectedTables.length > 0 ? detectedTables : SAMPLE_TABLES);
      setConnectionStatus('connected');
      if (detectedTables.length > 0) {
        setSelectedTable(detectedTables[0].name);
      } else {
        setSelectedTable(SAMPLE_TABLES[0].name);
      }
    } catch (err: any) {
      console.error('[SUPABASE_CONN_ERR]', err);
      setConnectionStatus('failed');
      setErrorMsg(`Failed to connect to Supabase: ${err.message}. Using high-fidelity local sandbox schemas.`);
      // Use sample tables in fallback mode
      setTables(SAMPLE_TABLES);
      setSelectedTable(SAMPLE_TABLES[0].name);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  // Run the raw SQL using Supabase RPC functions (exec_sql, run_sql) with progressive fallback
  const handleRunSqlQuery = async () => {
    if (!sqlQuery.trim()) {
      setErrorMsg('SQL Query cannot be empty.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setQueryResults(null);
    const startTime = performance.now();

    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
    const headers = getAuthHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    });

    // We will attempt to run the query via common Postgres runner RPC endpoints
    // 1. /rpc/exec_sql (highly common for remote queries)
    // 2. /rpc/run_sql
    // 3. /rpc/execute_sql
    // 4. Client-side local parsing fallback if Supabase lacks raw execution rights
    
    const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'sql'];
    let success = false;
    let finalData: any[] = [];
    let finalError = '';

    for (const rpc of rpcNames) {
      try {
        const payload = rpc === 'exec_sql' || rpc === 'run_sql' 
          ? { query: sqlQuery } 
          : { sql: sqlQuery };

        const res = await fetch(`${cleanUrl}/rpc/${rpc}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          finalData = Array.isArray(data) ? data : [data];
          success = true;
          setSuccessMsg(`Query executed successfully via rpc/${rpc}!`);
          break;
        } else {
          const text = await res.text();
          finalError = `RPC ${rpc} failed with status ${res.status}: ${text}`;
        }
      } catch (err: any) {
        finalError = err.message;
      }
    }

    // If direct RPC SQL execution failed (which is typical if Supabase security restricts RPC creation), 
    // we use our intelligent Client-side Query Emulator / Direct REST Fallback!
    // This allows the user to still query tables using standard SQL-like syntax!
    if (!success) {
      console.warn('[SQL_RUNNER] Direct SQL RPC endpoints not found or restricted. Falling back to Intelligent REST SQL Parsing.', finalError);
      
      try {
        // Parse the query simply (e.g. SELECT * FROM table)
        const selectMatch = sqlQuery.match(/select\s+(.+?)\s+from\s+(\w+)/i);
        const insertMatch = sqlQuery.match(/insert\s+into\s+(\w+)/i);
        const updateMatch = sqlQuery.match(/update\s+(\w+)/i);
        const deleteMatch = sqlQuery.match(/delete\s+from\s+(\w+)/i);

        if (selectMatch) {
          const fieldsStr = selectMatch[1].trim();
          const tableName = selectMatch[2].trim();
          
          // Execute beautiful direct REST lookup to represent the query
          let selectParam = '*';
          if (fieldsStr !== '*') {
            selectParam = fieldsStr.replace(/\s+/g, '');
          }

          // Search for where clause filter
          const whereMatch = sqlQuery.match(/where\s+(.+?)(?:order|limit|group|;|$)/i);
          const limitMatch = sqlQuery.match(/limit\s+(\d+)/i);
          const orderMatch = sqlQuery.match(/order\s+by\s+(\w+)\s*(asc|desc)?/i);

          let queryParams = new URLSearchParams();
          queryParams.append('select', selectParam);
          
          if (limitMatch) {
            const requestedLimit = parseInt(limitMatch[1], 10);
            if (requestedLimit > 1000) {
              queryParams.append('limit', '1000');
              setSuccessMsg('SQL translated! Note: Supabase limits single requests to a maximum of 1000 rows.');
            } else {
              queryParams.append('limit', limitMatch[1]);
            }
          } else {
            queryParams.append('limit', '1000'); // Default to Supabase max of 1000 rows
          }

          if (orderMatch) {
            const col = orderMatch[1];
            const direction = (orderMatch[2] || 'asc').toLowerCase();
            queryParams.append('order', `${col}.${direction}`);
          }

          // Basic parsing for single where condition, e.g. status = 'Pending' or id = 'GF-1002'
          if (whereMatch) {
            const condition = whereMatch[1].replace(/['";]+/g, '').trim();
            const eqMatch = condition.match(/(\w+)\s*=\s*(.+)/);
            if (eqMatch) {
              const col = eqMatch[1].trim();
              const val = eqMatch[2].trim();
              queryParams.append(col, `eq.${val}`);
            }
          }

          const fetchUrl = `${cleanUrl}/${tableName}?${queryParams.toString()}`;
          const res = await fetch(fetchUrl, {
            method: 'GET',
            headers
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Table "${tableName}" select failed: ${errText}`);
          }

          const data = await res.json();
          finalData = data;
          success = true;
          if (!successMsg) {
            setSuccessMsg(`SQL parsed & translated to Supabase REST query successfully!`);
          }
        } else if (deleteMatch) {
          const tableName = deleteMatch[1].trim();
          const whereMatch = sqlQuery.match(/where\s+(.+?)(?:order|limit|group|;|$)/i);

          let queryParams = new URLSearchParams();
          if (whereMatch) {
            const condition = whereMatch[1].replace(/['";]+/g, '').trim();
            const eqMatch = condition.match(/(\w+)\s*=\s*(.+)/);
            if (eqMatch) {
              const col = eqMatch[1].trim();
              const val = eqMatch[2].trim();
              queryParams.append(col, `eq.${val}`);
            } else {
              throw new Error(`DELETE statements require a simple WHERE condition like "WHERE col = val" for REST client translation.`);
            }
          } else {
            throw new Error(`DELETE statements without a WHERE clause are dangerous and restricted on client-side translation. Please specify a WHERE filter.`);
          }

          const deleteUrl = `${cleanUrl}/${tableName}?${queryParams.toString()}`;
          const res = await fetch(deleteUrl, {
            method: 'DELETE',
            headers
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Table "${tableName}" delete failed: ${errText}`);
          }

          success = true;
          finalData = [{ status: "success", message: `Rows matching condition deleted from ${tableName}` }];
          setSuccessMsg(`SQL DELETE parsed & translated to Supabase REST query successfully!`);
        } else if (insertMatch) {
          const tableName = insertMatch[1].trim();
          // Fallback simple prompt or local storage mock action
          throw new Error(`INSERT query detected. To execute writes, please run them via the interactive table browser, or configure the 'exec_sql' RPC function in your Supabase Dashboard.`);
        } else {
          throw new Error(`Raw SQL runner restricted on client-side. Please write SELECT or DELETE queries, or use the interactive "Table Browser" tab to manage rows directly.`);
        }
      } catch (fallbackErr: any) {
        setErrorMsg(fallbackErr.message || 'SQL Execution failed on remote database.');
      }
    }

    const endTime = performance.now();
    setExecutionTime(Math.round(endTime - startTime));

    if (success && finalData) {
      setQueryResults(finalData);
      setAffectedRows(finalData.length);
      if (finalData.length > 0) {
        setQueryColumns(Object.keys(finalData[0]));
      } else {
        setQueryColumns([]);
      }
    }

    setIsLoading(false);
  };

  // Browser Direct Actions (CRUD via standard Supabase APIs)
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [currentRowData, setCurrentRowData] = useState<any>({});
  const [isNewRow, setIsNewRow] = useState(true);

  const fetchTableRows = async () => {
    if (!selectedTable) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
      const fetchUrl = `${cleanUrl}/${selectedTable}?limit=${restLimit}&offset=${restOffset}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed to fetch rows from ${selectedTable}`);
      }

      const data = await response.json();
      setTableRows(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Error fetching table data: ${err.message}. Using offline mock local storage database instead.`);
      // Fallback local storage
      const savedMock = localStorage.getItem(`mock_sb_${selectedTable}`);
      if (savedMock) {
        setTableRows(JSON.parse(savedMock));
      } else {
        // Generate high fidelity mock records based on table columns
        const cols = tables.find(t => t.name === selectedTable)?.columns || ['id', 'created_at'];
        const sampleRecord: any = {};
        cols.forEach((c: string) => {
          if (c === 'id') sampleRecord[c] = '1';
          else if (c.includes('price')) sampleRecord[c] = 49.99;
          else if (c.includes('stock')) sampleRecord[c] = 15;
          else if (c.includes('created') || c.includes('at')) sampleRecord[c] = new Date().toISOString();
          else sampleRecord[c] = `Sample ${c}`;
        });
        setTableRows([sampleRecord]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browser' && selectedTable) {
      fetchTableRows();
    }
  }, [activeTab, selectedTable, restLimit, restOffset]);

  const handleSaveRow = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
    const headers = getAuthHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    });

    try {
      let response;
      if (isNewRow) {
        // Insert Row
        response = await fetch(`${cleanUrl}/${selectedTable}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(currentRowData)
        });
      } else {
        // Update Row
        const recordId = currentRowData.id;
        if (!recordId) {
          throw new Error('Record must have an id column to update!');
        }
        response = await fetch(`${cleanUrl}/${selectedTable}?id=eq.${recordId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(currentRowData)
        });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to submit database transaction.');
      }

      setSuccessMsg(isNewRow ? 'Record inserted successfully!' : 'Record updated successfully!');
      setIsRowModalOpen(false);
      fetchTableRows();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Database Write Failure: ${err.message}. Saving changes to local offline emulator state.`);
      // Mock offline save
      let updatedRows = [...tableRows];
      if (isNewRow) {
        const withId = { ...currentRowData, id: currentRowData.id || `MOCK-${Math.floor(Math.random() * 9000 + 1000)}` };
        updatedRows.unshift(withId);
      } else {
        updatedRows = updatedRows.map(r => r.id === currentRowData.id ? currentRowData : r);
      }
      setTableRows(updatedRows);
      localStorage.setItem(`mock_sb_${selectedTable}`, JSON.stringify(updatedRows));
      setIsRowModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRow = async (id: string | number) => {
    if (!confirm(`Are you sure you want to delete record ${id} from "${selectedTable}"?`)) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
      const response = await fetch(`${cleanUrl}/${selectedTable}?id=eq.${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete record.');
      }

      setSuccessMsg('Record deleted successfully!');
      fetchTableRows();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Delete Error: ${err.message}. Removing locally inside offline emulator.`);
      const updatedRows = tableRows.filter(r => r.id !== id);
      setTableRows(updatedRows);
      localStorage.setItem(`mock_sb_${selectedTable}`, JSON.stringify(updatedRows));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRowModal = (row: any = null) => {
    const cols = tables.find(t => t.name === selectedTable)?.columns || [];
    const template: any = {};
    cols.forEach((c: string) => {
      template[c] = row ? row[c] ?? '' : '';
    });
    
    setCurrentRowData(template);
    setIsNewRow(!row);
    setIsRowModalOpen(true);
  };

  const handleInjectTemplate = (templateSql: string) => {
    setSqlQuery(templateSql);
    setActiveTab('editor');
  };

  const handleCopyResults = () => {
    if (!queryResults) return;
    navigator.clipboard.writeText(JSON.stringify(queryResults, null, 2));
    setSuccessMsg('Results copied to clipboard!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDownloadCSV = () => {
    if (!queryResults || queryResults.length === 0) return;
    const headers = queryColumns.join(',');
    const rows = queryResults.map(row => 
      queryColumns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GAAFOW_query_results_${selectedTable || 'custom'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Supabase SQL Editor</h1>
                <span className="bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Admin database interface for GAAFOW e-commerce cloud tables, schemas, and live SQL metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Database Status and Connection Settings button */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              connectionStatus === 'failed' ? 'bg-amber-500 animate-bounce' : 'bg-slate-600'
            }`} />
            <span className="text-xs font-bold text-slate-300">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'failed' ? 'Limited/Offline Mode' : 'Connecting...'}
            </span>
          </div>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Connection config</span>
          </button>
        </div>
      </div>

      {/* Action Notifications & Messages */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-amber-950/40 border border-amber-900/50 text-amber-300 rounded-xl text-xs flex items-start gap-3 leading-relaxed animate-pulse"
          >
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-sm mb-1">Notice</span>
              <div>{errorMsg}</div>
              {(errorMsg.toLowerCase().includes('products') || 
                errorMsg.toLowerCase().includes('orders') || 
                errorMsg.toLowerCase().includes('pgrst205') || 
                errorMsg.toLowerCase().includes('schema cache')) && (
                <div className="mt-3 pt-2.5 border-t border-amber-900/40 flex flex-wrap items-center gap-3">
                  <span className="text-amber-400 font-bold">Missing database tables or schema cache?</span>
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Go to Supabase Setup Guide →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 rounded-xl text-xs flex items-center gap-3 font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout Content Tabs */}
      <div className="flex flex-wrap md:flex-nowrap gap-2 border-b border-slate-200 mb-8 bg-white p-2 rounded-2xl border shadow-sm">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Interactive Query Console</span>
        </button>
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'browser'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Direct Table Browser</span>
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-emerald-600 text-white shadow-md font-semibold'
              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/75 border border-emerald-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Supabase Setup Guide</span>
        </button>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Schema Explorer */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm self-start">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-600" /> Database Schema
            </span>
            <button 
              onClick={testConnection} 
              disabled={isConnecting}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh Schema"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table list filter */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {filteredTables.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">No tables discovered.</p>
            ) : (
              filteredTables.map((table) => (
                <div key={table.name} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div 
                    onClick={() => {
                      setSelectedTable(table.name);
                      if (activeTab !== 'browser') {
                        setSqlQuery(`SELECT * FROM ${table.name} LIMIT 25;`);
                      }
                    }}
                    className={`flex items-center gap-2 font-mono text-xs font-bold cursor-pointer transition-colors ${
                      selectedTable === table.name ? 'text-emerald-600' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{table.name}</span>
                  </div>

                  {/* Column schemas under the table */}
                  <div className="mt-2 pl-4 border-l border-slate-200 space-y-1">
                    {table.columns.map((col: string) => (
                      <div key={col} className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>{col}</span>
                        <span className="text-[9px] text-slate-400 font-sans italic">
                          {col === 'id' ? 'primary key' : typeof col}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Console / Workspace Area */}
        <div className="lg:col-span-3 space-y-8">

          {/* TAB 1: INTERACTIVE QUERY CONSOLE */}
          {activeTab === 'editor' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Query Panel Header bar */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Raw SQL Terminal
                </span>
                
                {/* Preset SQL injections */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Templates:</span>
                  <select 
                    onChange={(e) => {
                      const selected = PRESET_TEMPLATES.find(p => p.name === e.target.value);
                      if (selected) handleInjectTemplate(selected.sql);
                    }}
                    className="bg-slate-900 text-[10px] font-extrabold text-slate-300 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select preset query...</option>
                    {PRESET_TEMPLATES.map((preset) => (
                      <option key={preset.name} value={preset.name}>{preset.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Query Input block */}
              <div className="p-6 space-y-4">
                <div className="relative">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={8}
                    className="w-full font-mono text-xs text-emerald-400 bg-slate-950 border border-slate-800 rounded-xl p-4 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 shadow-inner"
                    placeholder="-- Write your SQL statement here (e.g. SELECT * FROM products;)"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono">
                    PostgreSQL Compatible
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Run standard SQL commands. Fallback handles select translation.</span>
                  </div>

                  <button
                    onClick={handleRunSqlQuery}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] disabled:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>Execute SQL Statement</span>
                  </button>
                </div>
              </div>

              {/* Query Output Logs & Columns */}
              {queryResults && (
                <div className="border-t border-slate-800 bg-slate-950 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">Rows returned: <strong className="text-emerald-400">{affectedRows}</strong></span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">Execution time: <strong className="text-emerald-400">{executionTime}ms</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopyResults}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </button>
                      <button 
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {queryResults.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-xl text-center text-xs text-slate-500 italic">
                      Query executed successfully but returned zero records.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-96">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800">
                            {queryColumns.map((col) => (
                              <th key={col} className="p-3 text-slate-300 font-bold tracking-wider capitalize min-w-[120px]">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {queryResults.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              {queryColumns.map((col) => {
                                const val = row[col];
                                const isObj = val !== null && typeof val === 'object';
                                return (
                                  <td key={col} className="p-3 text-slate-400 truncate max-w-xs" title={isObj ? JSON.stringify(val) : String(val)}>
                                    {isObj ? (
                                      <span className="text-[10px] text-amber-500 italic">JSON Object</span>
                                    ) : val === null || val === undefined ? (
                                      <span className="text-slate-600 italic">null</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT TABLE BROWSER */}
          {activeTab === 'browser' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-6 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                    <Table className="w-5 h-5 text-emerald-600" />
                    <span>Table Viewer: {selectedTable || 'Select a table'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct live transaction grid. View, add, modify, and delete rows instantly on Supabase.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleOpenRowModal()}
                    disabled={!selectedTable}
                    className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert New Record</span>
                  </button>

                  <button
                    onClick={fetchTableRows}
                    disabled={isLoading || !selectedTable}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table Data Grid */}
              {tableRows.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 italic">
                  No records found in table "{selectedTable}". Add some records or reload.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        {tables.find(t => t.name === selectedTable)?.columns.map((col: string) => (
                          <th key={col} className="p-4 uppercase tracking-wider">{col}</th>
                        )) || Object.keys(tableRows[0]).map((col) => (
                          <th key={col} className="p-4 uppercase tracking-wider">{col}</th>
                        ))}
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {tableRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          {(tables.find(t => t.name === selectedTable)?.columns || Object.keys(row)).map((col: string) => {
                            const val = row[col];
                            return (
                              <td key={col} className="p-4 truncate max-w-xs font-mono text-[11px]">
                                {val === null || val === undefined ? (
                                  <span className="text-slate-300 italic">null</span>
                                ) : typeof val === 'object' ? (
                                  <span className="text-amber-600 italic">Object JSON</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenRowModal(row)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Control pagination limits */}
              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span>Display Limit:</span>
                  <select 
                    value={restLimit} 
                    onChange={(e) => setRestLimit(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value={10}>10 records</option>
                    <option value={20}>20 records</option>
                    <option value={50}>50 records</option>
                    <option value={100}>100 records</option>
                    <option value={500}>500 records</option>
                    <option value={1000}>1000 records (Supabase maximum)</option>
                  </select>
                </div>

                <span>Viewing {tableRows.length} recent database rows</span>
              </div>
            </div>
          )}

          {/* TAB 3: CONNECTION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Configure Supabase Target Client</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Change target endpoints to run SQL scripts on any Supabase project. These keys are only stored securely in your browser's local sandbox.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Supabase REST Endpoint URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="https://YOUR-PROJECT.supabase.co/rest/v1/"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Publishable API Key (anon/service)</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={testConnection}
                  disabled={isConnecting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Test Connection
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  Save and Apply Config
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SUPABASE SETUP & DDL SCHEMA */}
          {activeTab === 'setup' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>Supabase Database Schema Setup</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Follow these step-by-step instructions to initialize your target Supabase PostgreSQL instance with the correct tables and policies.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SETUP_SQL_SCRIPT);
                    setSuccessMsg('SQL Schema Script copied to clipboard!');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-center shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL Script</span>
                </button>
              </div>

              {/* Steps block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <div className="bg-emerald-50 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0">1</div>
                  <div className="text-xs">
                    <h4 className="font-extrabold text-slate-900 mb-1">Open Dashboard</h4>
                    <p className="text-slate-500 leading-relaxed">Log in to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline hover:text-emerald-700">Supabase Console</a> and select your e-commerce project.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <div className="bg-emerald-50 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
                  <div className="text-xs">
                    <h4 className="font-extrabold text-slate-900 mb-1">Paste SQL Query</h4>
                    <p className="text-slate-500 leading-relaxed">Navigate to <strong>SQL Editor</strong> on the left navigation, click <strong>New Query</strong>, and paste the copied script.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <div className="bg-emerald-50 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
                  <div className="text-xs">
                    <h4 className="font-extrabold text-slate-900 mb-1">Run and Refresh</h4>
                    <p className="text-slate-500 leading-relaxed">Click the <strong>Run</strong> button. Once successfully finished, click <strong>Refresh Schema</strong> in the sidebar here!</p>
                  </div>
                </div>
              </div>

              {/* Code display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-black uppercase tracking-wider text-slate-400">PostgreSQL Schema & Seed Script (4 Tables)</span>
                  <span className="font-mono text-[10px]">6.8 KB • UTF-8</span>
                </div>
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-300 text-[11px] font-mono rounded-xl overflow-x-auto max-h-[320px] border border-slate-800 leading-relaxed scrollbar-thin">
                    {SETUP_SQL_SCRIPT}
                  </pre>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SETUP_SQL_SCRIPT);
                        setSuccessMsg('SQL Schema Script copied to clipboard!');
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Script"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table metadata overview */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Target Schema Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                    <strong className="block text-slate-900 font-mono">public.products</strong>
                    <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Saves all catalog merchandise titles, categories, stock limits, and prices.</span>
                  </div>
                  <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                    <strong className="block text-slate-900 font-mono">public.orders</strong>
                    <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Maintains Somali client details, total cash, payment methods (e.g. ZAAD), and status.</span>
                  </div>
                  <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                    <strong className="block text-slate-900 font-mono">public.order_items</strong>
                    <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Links products, custom amounts, and quantities safely to active orders.</span>
                  </div>
                  <div className="text-xs bg-white p-3 rounded-lg border border-slate-100">
                    <strong className="block text-slate-900 font-mono">public.notifications</strong>
                    <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">Logs emails and Twilio/Meta WhatsApp dispatch receipts.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Row details popup modal */}
      <AnimatePresence>
        {isRowModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  {isNewRow ? 'Insert Database Record' : 'Modify Database Record'}
                </span>
                <button 
                  onClick={() => setIsRowModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {Object.keys(currentRowData).map((col) => (
                  <div key={col}>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{col}</label>
                    <input
                      type="text"
                      disabled={col === 'id' && !isNewRow}
                      value={currentRowData[col]}
                      onChange={(e) => setCurrentRowData({ ...currentRowData, [col]: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      placeholder={`Enter ${col} value...`}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setIsRowModalOpen(false)}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRow}
                  className="px-6 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  Commit Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
