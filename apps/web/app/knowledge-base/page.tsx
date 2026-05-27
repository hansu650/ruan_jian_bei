"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  FileText,
  LibraryBig,
  Search,
  Upload,
  WandSparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCourseDocuments,
  getCourses,
  getDocumentChunks,
  getKnowledgeBaseStats,
  importSampleDocuments,
  searchKnowledgeBase,
  uploadCourseDocument,
} from "@/lib/api";
import type {
  Course,
  CourseDocument,
  DocumentChunk,
  DocumentImportResult,
  DocumentSearchResult,
  KnowledgeBaseStats,
} from "@/lib/types";

const fieldClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const quickQueries = ["幻读", "B+树", "JOIN"];

export default function KnowledgeBasePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CourseDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("幻读");
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [importResult, setImportResult] = useState<DocumentImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadKnowledgeBase(courseId: number) {
    const [documentList, statData] = await Promise.all([
      getCourseDocuments(courseId),
      getKnowledgeBaseStats(courseId),
    ]);
    setDocuments(documentList);
    setStats(statData);
  }

  async function loadInitialData() {
    setLoading(true);
    setError(null);
    try {
      const courseList = await getCourses();
      setCourses(courseList);
      const defaultCourse =
        courseList.find((course) => course.title === "数据库系统") ?? courseList[0] ?? null;
      setSelectedCourseId(defaultCourse?.id ?? null);
      if (defaultCourse) {
        await loadKnowledgeBase(defaultCourse.id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "知识库数据请求失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCourseChange(courseId: number) {
    setSelectedCourseId(courseId);
    setSelectedDocument(null);
    setChunks([]);
    setSearchResults([]);
    setError(null);
    try {
      await loadKnowledgeBase(courseId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "切换课程失败");
    }
  }

  async function handleImportSample() {
    if (!selectedCourseId) {
      setError("请先选择课程");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await importSampleDocuments(selectedCourseId);
      setImportResult(result);
      await loadKnowledgeBase(selectedCourseId);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入示例资料失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourseId || !selectedFile) {
      setError("请选择课程和 .md / .txt 文件");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uploadCourseDocument(selectedCourseId, selectedFile);
      setSelectedFile(null);
      await loadKnowledgeBase(selectedCourseId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传资料失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectDocument(document: CourseDocument) {
    if (!selectedCourseId) {
      return;
    }
    setSelectedDocument(document);
    setError(null);
    try {
      setChunks(await getDocumentChunks(selectedCourseId, document.id));
    } catch (chunkError) {
      setError(chunkError instanceof Error ? chunkError.message : "读取 chunk 失败");
    }
  }

  async function runSearch(nextQuery?: string) {
    if (!selectedCourseId) {
      setError("请先选择课程");
      return;
    }
    const query = (nextQuery ?? searchQuery).trim();
    setSearchQuery(query);
    setBusy(true);
    setError(null);
    try {
      setSearchResults(await searchKnowledgeBase(selectedCourseId, query, 10));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "搜索失败");
    } finally {
      setBusy(false);
    }
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Badge variant="warning">第四阶段：课程资料与知识库基础</Badge>
        <h1 className="mt-3 text-3xl font-bold">课程知识库</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          本页只演示 Markdown/TXT 资料导入、文本分块、SQLite 入库和基础关键词检索，不接入
          RAG、embedding 或大模型。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>知识库操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LibraryBig className="h-5 w-5 text-primary" aria-hidden="true" />
                  课程选择
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  className={fieldClass}
                  value={selectedCourseId ?? ""}
                  onChange={(event) => void handleCourseChange(Number(event.target.value))}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectedCourse?.description ??
                    "后端启动后会写入默认《数据库系统》课程，可作为知识库演示入口。"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">知识库统计</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <Stat label="文档数" value={stats?.document_count ?? 0} />
                <Stat label="chunk 数" value={stats?.chunk_count ?? 0} />
                <Stat label="已索引" value={stats?.indexed_document_count ?? 0} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">导入示例资料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  示例资料来自 `data/sample_courses/database_system/`，为团队原创整理内容，不包含出版教材原文或 PDF。
                </p>
                <Button onClick={() => void handleImportSample()} disabled={busy || !selectedCourseId}>
                  <WandSparkles className="h-4 w-4" aria-hidden="true" />
                  导入《数据库系统》示例资料
                </Button>
                {importResult && (
                  <div className="rounded-md border bg-background p-3 text-sm">
                    <p className="font-medium">{importResult.message}</p>
                    <p className="mt-2 text-muted-foreground">
                      导入 {importResult.imported_documents}，索引{" "}
                      {importResult.indexed_documents}，新增 chunk{" "}
                      {importResult.created_chunks}，跳过 {importResult.skipped_documents}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">上传资料</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={(event) => void handleUpload(event)}>
                  <input
                    className={fieldClass}
                    type="file"
                    accept=".md,.txt,text/markdown,text/plain"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    当前仅支持 Markdown 和 TXT，单文件不超过 2MB。PDF/Word/PPTX 后续阶段再扩展。
                  </p>
                  <Button type="submit" variant="outline" disabled={busy || !selectedFile}>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    上传并索引
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  文档列表
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    暂无文档。可以先导入示例资料，或上传 .md / .txt 文件。
                  </p>
                )}
                {documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    className="w-full rounded-md border bg-background p-3 text-left hover:border-primary/50"
                    onClick={() => void handleSelectDocument(document)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={document.status === "indexed" ? "success" : "outline"}>
                        {document.status}
                      </Badge>
                      <Badge variant="secondary">{document.file_type}</Badge>
                      <Badge variant="outline">{document.source_type}</Badge>
                    </div>
                    <p className="mt-2 font-medium">{document.original_filename}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      chunk {document.chunk_count} / {new Date(document.created_at).toLocaleString()}
                    </p>
                    {document.error_message && (
                      <p className="mt-2 text-xs text-destructive">{document.error_message}</p>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDocument ? `${selectedDocument.original_filename} chunks` : "文档 chunk"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chunks.length === 0 && (
                  <p className="text-sm text-muted-foreground">点击左侧文档后查看分块结果。</p>
                )}
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="rounded-md border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{chunk.chunk_index}</Badge>
                      {chunk.section_title && <Badge variant="secondary">{chunk.section_title}</Badge>}
                      <span className="text-xs text-muted-foreground">{chunk.char_count} 字符</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {chunk.content.slice(0, 300)}
                      {chunk.content.length > 300 ? "..." : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5 text-primary" aria-hidden="true" />
                  关键词检索
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => {
                  event.preventDefault();
                  void runSearch();
                }}>
                  <input
                    className={fieldClass}
                    placeholder="搜索幻读、B+树、JOIN..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <Button type="submit" disabled={busy}>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    搜索
                  </Button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {quickQueries.map((query) => (
                    <Button
                      key={query}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void runSearch(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div key={result.chunk_id} className="rounded-md border bg-background p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="warning">score {result.score}</Badge>
                        <Badge variant="secondary">{result.filename}</Badge>
                        <Badge variant="outline">chunk {result.chunk_index}</Badge>
                        {result.section_title && <Badge variant="outline">{result.section_title}</Badge>}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.content}</p>
                      <p className="mt-3 break-all rounded-md bg-muted p-2 text-xs text-muted-foreground">
                        {result.metadata_json}
                      </p>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      导入资料后，可以用快捷按钮搜索“幻读”“B+树”“JOIN”。
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
