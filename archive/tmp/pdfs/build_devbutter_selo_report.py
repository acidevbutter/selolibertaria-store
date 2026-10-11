from __future__ import annotations

import re
import subprocess
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, Paragraph,
    Spacer, Table, TableStyle,
)
from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String

ROOT = Path('/Users/marcospereira/development/selolibertaria')
REPO = ROOT / 'selolibertaria-store'
OUT = ROOT / 'output/pdf/relatorio-devbutter-selo-libertaria-jun-set-2026.pdf'
ASSETS = ROOT / 'tmp/pdfs/devbutter_report_assets'
ASSETS.mkdir(parents=True, exist_ok=True)

NAVY = '#081A2B'
BLUE = '#2B7FFF'
CYAN = '#54D6FF'
ORANGE = '#FF7A45'
GOLD = '#FFC857'
INK = '#142033'
MUTED = '#607086'
PALE = '#EAF3FF'
LINE = '#D7E2EE'
GREEN = '#2FA56A'
RED = '#E76661'


def git(args: list[str]) -> str:
    return subprocess.check_output(['git', '-C', str(REPO), *args], text=True)


def classify_area(subject: str) -> str:
    s = subject.lower()
    if re.search(r'asaas|checkout|pagamento|payment|frete|shipping|cep|cart', s):
        return 'Compra e pagamento'
    if re.search(r'admin|design system|ui|editorial|media|cat[aá]logo|produto', s):
        return 'Admin e experiência'
    if re.search(r'docker|coolify|hostinger|ci|deploy|build|healthcheck|infra', s):
        return 'Entrega e infraestrutura'
    if re.search(r'maintenance|manuten', s):
        return 'Estabilidade operacional'
    return 'Evolução da plataforma'


def difficulty(subject: str) -> str:
    s = subject.lower()
    if re.search(r'asaas|checkout|payment|pagamento|oauth|webhook|coolify|docker|deploy|database|migration|auth', s):
        return 'Alta'
    if re.search(r'feat|refactor|editorial|media|admin|design system|frete|shipping|cep|test', s):
        return 'Média'
    return 'Baixa'


def load_data() -> pd.DataFrame:
    raw = git([
        'log', '--all', '--author=Marcos Pereira\\|DevButter\\|acidbutter96',
        '--since=2026-06-01T00:00:00-03:00', '--until=2026-09-15T00:00:00-03:00',
        '--date=iso-strict', '--pretty=format:%H%x1f%ad%x1f%s%x1e'
    ])
    rows = []
    for record in raw.split('\x1e'):
        if not record.strip():
            continue
        sha, date, subject = record.strip().split('\x1f')
        rows.append({'sha': sha, 'timestamp': pd.Timestamp(date), 'subject': subject})
    df = pd.DataFrame(rows).sort_values('timestamp')
    df['date'] = df['timestamp'].dt.tz_convert('America/Sao_Paulo').dt.date
    df['month'] = df['timestamp'].dt.tz_convert('America/Sao_Paulo').dt.strftime('%Y-%m')
    df['area'] = df['subject'].map(classify_area)
    df['difficulty'] = df['subject'].map(difficulty)
    return df


def estimate_daily_hours(df: pd.DataFrame) -> pd.DataFrame:
    result = []
    for date, group in df.groupby('date', sort=True):
        times = group['timestamp'].sort_values().tolist()
        sessions, total, start, last = 0, 0.0, None, None
        for t in times:
            if last is None or (t - last).total_seconds() > 90 * 60:
                if start is not None:
                    total += max(0.5, (last - start).total_seconds() / 3600)
                sessions += 1
                start = t
            last = t
        if start is not None:
            total += max(0.5, (last - start).total_seconds() / 3600)
        result.append({'date': pd.Timestamp(date), 'commits': len(group), 'sessions': sessions, 'hours': total})
    return pd.DataFrame(result)


def plot_monthly(monthly: pd.DataFrame) -> Drawing:
    d = Drawing(500, 180)
    d.add(String(0, 165, 'Volume de entregas por mês', fontName='Helvetica-Bold', fontSize=11, fillColor=colors.HexColor(INK)))
    d.add(String(270, 165, 'Horas estimadas por mês', fontName='Helvetica-Bold', fontSize=11, fillColor=colors.HexColor(INK)))
    max_commits = max(monthly['commits']); max_hours = max(monthly['hours'])
    for i, row in monthly.reset_index(drop=True).iterrows():
        x = 28 + i * 56; h = 110 * row['commits'] / max_commits
        d.add(Rect(x, 30, 28, h, fillColor=colors.HexColor(BLUE), strokeColor=None))
        d.add(String(x + 14, 18, row['label'], textAnchor='middle', fontSize=8, fillColor=colors.HexColor(MUTED)))
        d.add(String(x + 14, 34 + h, str(int(row['commits'])), textAnchor='middle', fontSize=8, fillColor=colors.HexColor(INK)))
    points = []
    for i, row in monthly.reset_index(drop=True).iterrows():
        x = 292 + i * 56; y = 30 + 110 * row['hours'] / max_hours; points.append((x, y))
        d.add(Circle(x, y, 3.5, fillColor=colors.HexColor(ORANGE), strokeColor=None))
        d.add(String(x, 18, row['label'], textAnchor='middle', fontSize=8, fillColor=colors.HexColor(MUTED)))
        d.add(String(x, y + 9, f"{row['hours']:.1f}", textAnchor='middle', fontSize=8, fillColor=colors.HexColor(INK)))
    for a, b in zip(points, points[1:]): d.add(Line(a[0], a[1], b[0], b[1], strokeColor=colors.HexColor(ORANGE), strokeWidth=2.4))
    d.add(Line(18, 30, 248, 30, strokeColor=colors.HexColor(LINE)))
    d.add(Line(282, 30, 492, 30, strokeColor=colors.HexColor(LINE)))
    return d


def plot_difficulty(monthly: pd.DataFrame) -> Drawing:
    d = Drawing(460, 165)
    d.add(String(0, 150, 'Complexidade técnica das entregas', fontName='Helvetica-Bold', fontSize=11, fillColor=colors.HexColor(INK)))
    palette = {'Alta': NAVY, 'Média': ORANGE, 'Baixa': GREEN}
    for j, level in enumerate(['Alta', 'Média', 'Baixa']):
        d.add(Rect(265 + j*56, 143, 8, 8, fillColor=colors.HexColor(palette[level]), strokeColor=None))
        d.add(String(276 + j*56, 143, level, fontSize=8, fillColor=colors.HexColor(MUTED)))
    maximum = max((monthly['Alta'] + monthly['Média'] + monthly['Baixa']).tolist())
    for i, row in monthly.reset_index(drop=True).iterrows():
        x = 48 + i * 90; bottom = 25
        for level in ['Alta', 'Média', 'Baixa']:
            h = 105 * row[level] / maximum
            d.add(Rect(x, bottom, 38, h, fillColor=colors.HexColor(palette[level]), strokeColor=None))
            bottom += h
        d.add(String(x+19, 12, row['label'], textAnchor='middle', fontSize=8, fillColor=colors.HexColor(MUTED)))
    d.add(Line(28, 25, 430, 25, strokeColor=colors.HexColor(LINE)))
    return d


def plot_month_activity(month: str, daily: pd.DataFrame) -> Drawing:
    data = daily[daily['date'].dt.strftime('%Y-%m') == month].copy()
    d = Drawing(465, 130)
    d.add(String(0, 118, 'Atividade diária registrada', fontName='Helvetica-Bold', fontSize=10, fillColor=colors.HexColor(INK)))
    max_commits = max(1, data['commits'].max()); count = len(data); width = max(2.5, 390 / count - 1)
    for i, row in data.reset_index(drop=True).iterrows():
        x = 34 + i * (390 / count); h = 75 * row['commits'] / max_commits
        d.add(Rect(x, 23, width, h, fillColor=colors.HexColor(BLUE), strokeColor=None))
        if row['date'].day in [1, 5, 10, 15, 20, 25, 30]: d.add(String(x, 10, str(row['date'].day), fontSize=7, fillColor=colors.HexColor(MUTED)))
    d.add(Line(28, 23, 435, 23, strokeColor=colors.HexColor(LINE)))
    return d


def para(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def page_number(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor(MUTED))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(1.6 * cm, 1.05 * cm, 'DevButter | Relatório de desenvolvimento')
    canvas.drawRightString(A4[0] - 1.6 * cm, 1.05 * cm, f'Página {doc.page}')
    canvas.restoreState()


def build_pdf(df: pd.DataFrame, daily: pd.DataFrame, monthly: pd.DataFrame) -> None:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=30, leading=35, textColor=colors.HexColor('#FFFFFF'), alignment=TA_LEFT, spaceAfter=14))
    styles.add(ParagraphStyle(name='CoverSub', parent=styles['Normal'], fontName='Helvetica', fontSize=13, leading=18, textColor=colors.HexColor('#D4E8FF')))
    styles.add(ParagraphStyle(name='H1Dev', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=21, leading=26, textColor=colors.HexColor(INK), spaceBefore=4, spaceAfter=12))
    styles.add(ParagraphStyle(name='H2Dev', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=colors.HexColor(INK), spaceBefore=8, spaceAfter=7))
    styles.add(ParagraphStyle(name='BodyDev', parent=styles['BodyText'], fontName='Helvetica', fontSize=10.2, leading=15, textColor=colors.HexColor(INK), spaceAfter=7))
    styles.add(ParagraphStyle(name='SmallDev', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.8, leading=12, textColor=colors.HexColor(MUTED)))
    styles.add(ParagraphStyle(name='KpiNum', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=22, leading=25, textColor=colors.HexColor(BLUE), alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='KpiLabel', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor(MUTED), alignment=TA_CENTER))
    doc = BaseDocTemplate(str(OUT), pagesize=A4, rightMargin=1.55*cm, leftMargin=1.55*cm, topMargin=1.45*cm, bottomMargin=1.7*cm)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
    doc.addPageTemplates([])
    from reportlab.platypus import PageTemplate
    doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=page_number)])
    story = []

    # Cover
    cover = Table([[para('RELATÓRIO DE DESENVOLVIMENTO<br/>SELO LIBERTÁRIA', styles['CoverTitle'])], [para('Evolução de trabalho ao longo dos meses<br/>Junho a Setembro de 2026', styles['CoverSub'])], [Spacer(1, 8*cm)], [para('DevButter<br/><font size="9">Dados consolidados do histórico local de desenvolvimento</font>', styles['CoverSub'])]], colWidths=[17.9*cm], rowHeights=[4.4*cm, 1.7*cm, 9.0*cm, 3.0*cm])
    cover.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor(NAVY)), ('LEFTPADDING', (0,0), (-1,-1), 22), ('RIGHTPADDING', (0,0), (-1,-1), 22), ('TOPPADDING', (0,0), (-1,-1), 18), ('BOTTOMPADDING', (0,0), (-1,-1), 12), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story += [cover, PageBreak()]

    total_commits = int(len(df)); active_days = int((daily['commits'] > 0).sum()); total_hours = daily['hours'].sum(); total_sessions = int(daily['sessions'].sum())
    story += [para('Visão executiva', styles['H1Dev'])]
    kpis = [[
        [para(f'{total_commits}', styles['KpiNum']), para('commits registrados', styles['KpiLabel'])],
        [para(f'{active_days}', styles['KpiNum']), para('dias com atividade', styles['KpiLabel'])],
        [para(f'{total_hours:.1f} h', styles['KpiNum']), para('horas estimadas', styles['KpiLabel'])],
        [para(f'{total_sessions}', styles['KpiNum']), para('sessões de desenvolvimento', styles['KpiLabel'])],
    ]]
    cells = []
    for value, label in zip([str(total_commits), str(active_days), f'{total_hours:.1f} h', str(total_sessions)], ['commits registrados', 'dias com atividade', 'horas estimadas', 'sessões de desenvolvimento']):
        cells.append([para(value, styles['KpiNum']), para(label, styles['KpiLabel'])])
    kpi_table = Table([cells], colWidths=[4.4*cm]*4, rowHeights=[1.55*cm])
    kpi_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor(PALE)),('BOX',(0,0),(-1,-1),.4,colors.HexColor(LINE)),('INNERGRID',(0,0),(-1,-1),.4,colors.HexColor(LINE)),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    story += [kpi_table, Spacer(1, .45*cm)]
    story += [para('O trabalho foi contínuo ao longo de quatro meses, com maior intensidade de entregas em julho e retomada forte em setembro. O foco evoluiu entre experiência administrativa, operação da loja, checkout e infraestrutura de publicação.', styles['BodyDev'])]
    story += [plot_monthly(monthly), Spacer(1, .1*cm)]
    story += [plot_difficulty(monthly), PageBreak()]

    labels = {'2026-06': 'Junho', '2026-07': 'Julho', '2026-08': 'Agosto', '2026-09': 'Setembro'}
    for month in monthly['month']:
        group = df[df['month'] == month].copy().sort_values('timestamp')
        metric = monthly[monthly['month'] == month].iloc[0]
        month_flow = [Spacer(1, .22*cm), para(f'{labels.get(month, month)}: trabalho registrado', styles['H1Dev'])]
        summary = Table([
            [para(f"<b>{int(metric['commits'])}</b><br/><font size='8'>commits</font>", styles['BodyDev']), para(f"<b>{int(metric['active_days'])}</b><br/><font size='8'>dias ativos</font>", styles['BodyDev']), para(f"<b>{metric['hours']:.1f} h</b><br/><font size='8'>horas estimadas</font>", styles['BodyDev'])]
        ], colWidths=[5.85*cm]*3)
        summary.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor(PALE)),('BOX',(0,0),(-1,-1),.4,colors.HexColor(LINE)),('INNERGRID',(0,0),(-1,-1),.4,colors.HexColor(LINE)),('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        month_flow += [summary, Spacer(1, .25*cm)]
        areas = group['area'].value_counts().head(3)
        focus_text = '; '.join([f'<b>{area}</b> ({count} entregas)' for area, count in areas.items()])
        month_flow += [para(f'<b>Focos do mês:</b> {focus_text}.', styles['BodyDev'])]
        month_flow += [plot_month_activity(month, daily), Spacer(1,.12*cm)]
        month_flow += [para('Destaques de desenvolvimento', styles['H2Dev'])]
        highlights = group['subject'].drop_duplicates().tail(7).tolist()[::-1]
        bullets = '<br/>'.join([f'• {re.sub("&", "&amp;", x)}' for x in highlights])
        month_flow += [para(bullets, styles['BodyDev'])]
        story += [KeepTogether(month_flow), PageBreak()]

    story += [para('Leitura dos dados', styles['H1Dev'])]
    story += [para('O relatório representa atividade de desenvolvimento observável no histórico local do repositório <b>selolibertaria-store</b>, atribuída aos autores Marcos Pereira, DevButter e acidbutter96. Os gráficos registram a evolução mensal e os destaques preservam o trabalho entregue ao longo de cada mês.', styles['BodyDev'])]
    story += [para('Como as horas foram estimadas', styles['H2Dev'])]
    story += [para('Cada dia foi agrupado em sessões de commits com intervalos de até 90 minutos. O total de cada sessão usa a janela entre o primeiro e o último commit, com mínimo de 30 minutos. É uma estimativa conservadora de atividade técnica, não um controle de ponto.', styles['BodyDev'])]
    story += [para('Escopo e limitações', styles['H2Dev'])]
    story += [para('O macOS não disponibilizou uma exportação histórica de Tempo de Uso pela interface, portanto o relatório não converte tempo de tela em horas de trabalho. Atividades sem commit, repositórios que não estão neste checkout, PRs, revisões e tarefas externas também não entram nos totais.', styles['BodyDev'])]
    story += [Spacer(1, .8*cm), para('DevButter', styles['H1Dev']), para('Produto, engenharia e operação com visão de negócio.', styles['BodyDev'])]
    doc.build(story)


if __name__ == '__main__':
    df = load_data()
    daily = estimate_daily_hours(df)
    monthly = (daily.assign(month=daily['date'].dt.strftime('%Y-%m')).groupby('month', as_index=False).agg(commits=('commits','sum'), active_days=('commits', lambda x: int((x > 0).sum())), sessions=('sessions','sum'), hours=('hours','sum')))
    difficulty_counts = pd.crosstab(df['month'], df['difficulty']).reindex(monthly['month'], fill_value=0)
    for col in ['Alta','Média','Baixa']:
        monthly[col] = difficulty_counts[col].values if col in difficulty_counts else 0
    monthly['label'] = monthly['month'].map({'2026-06':'Jun', '2026-07':'Jul', '2026-08':'Ago', '2026-09':'Set'})
    build_pdf(df, daily, monthly)
    print(f'PDF criado: {OUT}')
