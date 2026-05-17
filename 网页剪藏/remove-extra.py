#!/usr/bin/env python3
"""
搜索目录中的文件，删除指定的HTML标签模式
"""

import os
import re
import sys
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description='Remove HTML patterns from files')
    parser.add_argument('-d', '--directory', default='.',
                        help='Directory to search in (default: current directory)')
    parser.add_argument('-r', '--recursive',
                        action='store_true', help='Search recursively')
    parser.add_argument('-v', '--verbose',
                        action='store_true', help='Verbose output')
    args = parser.parse_args()

    # 要删除的模式列表
    patterns = [
        r'<[/]?code.*?>',
        r'[Cc][Oo][Pp][Yy]',
        r'<[/]?p>',
        r'<[/]?span>',
        r'&.*?;',
    ]

    # 将模式编译为正则表达式对象
    compiled_patterns = [re.compile(pattern) for pattern in patterns]

    # 记录匹配文件
    matched_files = set()

    # 搜索文件
    search_path = Path(args.directory)

    if args.verbose:
        print(f"Searching in {search_path.absolute()}")

    # 确定搜索方法
    if args.recursive:
        files_to_check = search_path.rglob('*.md')
    else:
        files_to_check = search_path.glob('*.md')

    # 过滤出普通文件
    files_to_check = [f for f in files_to_check if f.is_file()]

    # 检查每个文件是否包含模式
    for file_path in files_to_check:
        try:
            # 尝试作为文本文件读取
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 检查是否有任何模式存在于文件中
            if any(pattern.search(content) for pattern in compiled_patterns):
                matched_files.add(file_path)
                if args.verbose:
                    print(f"Match found in: {file_path}")
        except (UnicodeDecodeError, PermissionError, IsADirectoryError):
            # 跳过无法读取的文件
            if args.verbose:
                print(f"Skipping {file_path}: Cannot read file")
            continue

    if not matched_files:
        print("No files found matching the patterns.")
        return

    print(f"Found {len(matched_files)} files with patterns to remove.")

    # 处理匹配的文件
    for file_path in matched_files:
        if args.verbose:
            print(f"Processing: {file_path}")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 应用所有模式替换
            modified_content = content
            for i, pattern in enumerate(compiled_patterns):
                old_content = modified_content
                modified_content = pattern.sub('', modified_content)
                if old_content != modified_content and args.verbose:
                    print(f"  Removed pattern: {patterns[i]}")

            # 如果内容有变化，写回文件
            if content != modified_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                print(f"Updated: {file_path}")
            elif args.verbose:
                print(f"  No changes needed in: {file_path}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print("Processing complete.")


if __name__ == "__main__":
    main()
