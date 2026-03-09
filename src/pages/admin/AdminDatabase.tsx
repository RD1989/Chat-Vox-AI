import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Database, Search, Trash2, Edit2, Play, Code,
    AlertCircle, Loader2, RefreshCw, Terminal, Save, X,
    LayoutGrid, List, FileJson
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const AdminDatabase = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sqlQuery, setSqlQuery] = useState("");
    const [sqlResult, setSqlResult] = useState<any>(null);
    const [errorDetails, setErrorDetails] = useState<any>(null);
    const [editingRow, setEditingRow] = useState<any>(null);

    useEffect(() => {
        loadTables();
    }, []);

    useEffect(() => {
        if (selectedTable) loadData(selectedTable);
    }, [selectedTable]);

    const loadTables = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("admin-database", {
                body: { action: "list_tables" },
            });

            if (error || !data?.tables) {
                // Fallback: use known tables if RPC fails
                setTables([
                    "vox_leads",
                    "vox_messages",
                    "vox_settings",
                    "vox_agents",
                    "vox_knowledge",
                    "profiles",
                    "system_settings"
                ]);
                if (error && !data?.migration) {
                    console.warn("RPC list_tables missing, using hardcoded fallback");
                }
                return;
            }
            setTables(data.tables.map((t: any) => t.table_name));
        } catch (e: any) {
            console.error(e);
            setTables(["vox_leads", "vox_messages", "vox_settings", "vox_agents", "vox_knowledge", "profiles", "system_settings"]);
        } finally {
            setLoading(false);
        }
    };

    const loadData = async (table: string) => {
        setLoading(true);
        try {
            // Try Edge Function first
            const { data, error } = await supabase.functions.invoke("admin-database", {
                body: { action: "get_data", table },
            });

            if (!error && data?.rows) {
                setRows(data.rows);
            } else {
                // Fallback: Direct Supabase Select (limited by RLS)
                const { data: directData, error: directError } = await supabase
                    .from(table as any)
                    .select("*")
                    .order("id" as any, { ascending: false } as any)
                    .limit(100);

                if (directError) throw directError;
                setRows(directData || []);
            }
        } catch (e: any) {
            toast.error("Erro ao buscar dados: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExecSql = async () => {
        if (!sqlQuery.trim()) return;
        setLoading(true);
        setSqlResult(null);
        try {
            const { data, error } = await supabase.functions.invoke("admin-database", {
                body: { action: "exec_sql", query: sqlQuery },
            });
            if (error) {
                if (data?.migration) setErrorDetails(data);
                throw error;
            }
            setSqlResult(data.result);
            toast.success("Comando SQL executado!");
        } catch (e: any) {
            toast.error("Erro no SQL: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta linha?")) return;
        try {
            const { error } = await supabase.functions.invoke("admin-database", {
                body: { action: "delete_row", table: selectedTable, id },
            });

            if (error) {
                const { error: directError } = await supabase
                    .from(selectedTable! as any)
                    .delete()
                    .eq("id" as any, id);
                if (directError) throw directError;
            }

            toast.success("Linha excluída!");
            loadData(selectedTable!);
        } catch (e: any) {
            toast.error("Erro ao excluir: " + e.message);
        }
    };

    const handleUpdate = async (id: string, updatedData: any) => {
        try {
            const { error } = await supabase.functions.invoke("admin-database", {
                body: { action: "update_row", table: selectedTable, id, data: updatedData },
            });

            if (error) {
                const { error: directError } = await supabase
                    .from(selectedTable! as any)
                    .update(updatedData)
                    .eq("id" as any, id);
                if (directError) throw directError;
            }

            toast.success("Dados atualizados!");
            setEditingRow(null);
            loadData(selectedTable!);
        } catch (e: any) {
            toast.error("Erro ao atualizar: " + e.message);
        }
    };

    const renderValue = (val: any) => {
        if (val === null) return <span className="text-muted-foreground italic">null</span>;
        if (typeof val === 'object') return <span className="text-[10px] opacity-70 truncate max-w-[150px] inline-block">{JSON.stringify(val)}</span>;
        if (typeof val === 'boolean') return <span className={val ? "text-green-500" : "text-red-500"}>{val ? 'true' : 'false'}</span>;
        return <span className="truncate max-w-[200px] inline-block">{String(val)}</span>;
    };

    if (errorDetails?.migration) {
        return (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                <Card className="border-destructive shadow-lg">
                    <CardHeader className="bg-destructive/10">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle size={24} />
                            <CardTitle>Configuração Necessária</CardTitle>
                        </div>
                        <CardDescription className="text-destructive/80">
                            Para usar o explorador de banco de dados, você precisa criar algumas funções auxiliares no seu banco Supabase.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm font-medium">Copie e execute o comando abaixo no **SQL Editor** do seu Dashboard Supabase:</p>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs overflow-x-auto border border-white/10">
                            <pre>{errorDetails.migration}</pre>
                        </div>
                        <Button onClick={() => { setErrorDetails(null); loadTables(); }} className="w-full">
                            <RefreshCw size={16} className="mr-2" /> Já executei, tentar novamente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <Database className="text-primary" /> Gerenciador de Banco de Dados
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualização, edição direta e console SQL para o banco de dados Supabase.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin text-primary" size={20} />}
                    <Button variant="outline" size="sm" onClick={() => selectedTable ? loadData(selectedTable) : loadTables()}>
                        <RefreshCw size={14} className="mr-2" /> Atualizar
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="explorer" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="explorer" className="flex items-center gap-2"><LayoutGrid size={16} /> Explorador</TabsTrigger>
                    <TabsTrigger value="sql" className="flex items-center gap-2"><Terminal size={16} /> Console SQL</TabsTrigger>
                </TabsList>

                <TabsContent value="explorer" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <Card className="lg:col-span-1 border-border bg-card">
                            <CardHeader className="py-4 px-5">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <List size={14} /> Tabelas Públicas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-2 pb-4">
                                <div className="space-y-1">
                                    {tables.map(table => (
                                        <button
                                            key={table}
                                            onClick={() => setSelectedTable(table)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${selectedTable === table
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-secondary text-foreground"
                                                }`}
                                        >
                                            <span className="truncate">{table}</span>
                                            <LayoutGrid size={12} className={selectedTable === table ? "opacity-100" : "opacity-0 group-hover:opacity-50"} />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3 border-border bg-card min-h-[500px]">
                            <CardHeader className="py-4 px-5 sticky top-0 bg-card/80 backdrop-blur-md z-10 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-medium">
                                            {selectedTable ? `Visualizando: ${selectedTable}` : "Selecione uma tabela"}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!selectedTable ? (
                                    <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
                                        <Database size={40} className="mb-4 opacity-10" />
                                        <p className="text-sm">Selecione uma tabela na barra lateral.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px]">
                                        <Table>
                                            <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                                                <TableRow>
                                                    {rows.length > 0 && Object.keys(rows[0]).map(key => (
                                                        <TableHead key={key} className="text-xs font-bold py-3">{key}</TableHead>
                                                    ))}
                                                    <TableHead className="w-[80px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rows.map((row, idx) => (
                                                    <TableRow key={idx} className="hover:bg-secondary/30">
                                                        {Object.keys(row).map(key => (
                                                            <TableCell key={key} className="text-[11px] py-2 px-3">
                                                                {editingRow?.id === row.id ? (
                                                                    <Input
                                                                        className="h-7 text-xs"
                                                                        defaultValue={row[key]}
                                                                        onBlur={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                                                                    />
                                                                ) : (
                                                                    renderValue(row[key])
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="p-2">
                                                            <div className="flex gap-1 justify-end">
                                                                {editingRow?.id === row.id ? (
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" onClick={() => handleUpdate(row.id, editingRow)}>
                                                                        <Save size={14} />
                                                                    </Button>
                                                                ) : (
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingRow(row)}>
                                                                        <Edit2 size={12} />
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sql" className="space-y-4 pt-4">
                    <Card className="border-border bg-card">
                        <CardHeader className="py-4 px-5">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Terminal size={16} /> Console SQL Raw
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 space-y-4">
                            <div className="relative group">
                                <textarea
                                    value={sqlQuery}
                                    onChange={(e) => setSqlQuery(e.target.value)}
                                    placeholder="SELECT * FROM vox_leads LIMIT 10..."
                                    className="w-full min-h-[150px] p-4 bg-slate-950 text-slate-50 font-mono text-sm rounded-lg border border-white/10 outline-none"
                                />
                                <Button
                                    onClick={handleExecSql}
                                    disabled={loading || !sqlQuery.trim()}
                                    className="absolute bottom-4 right-4"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play size={16} className="mr-2" />}
                                    Executar SQL
                                </Button>
                            </div>

                            {sqlResult && (
                                <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto max-h-[400px]">
                                    <pre className="text-xs text-blue-300">{JSON.stringify(sqlResult, null, 2)}</pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDatabase;
